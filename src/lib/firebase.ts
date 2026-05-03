import { Post } from "../types/index.ts";

import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  update,
  push,
  serverTimestamp,
  child,
  get,
  onValue,
  query,
  orderByChild,
  limitToLast,
  limitToFirst,
} from "firebase/database";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
  GoogleAuthProvider,
  getAuth,
} from "firebase/auth";

import { connectAuthEmulator } from "firebase/auth";
import { connectDatabaseEmulator } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DB_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export interface UserCounts {
  posts: number;
  replies: number;
  interacted: number;
}

/** Options for creating a new post, reply, or sub-reply. */
export interface CreatePostOptions {
  userId: string;
  content: string;
  authorDisplay: string;
  /** root post being replied to; absent for top-level posts */
  parentPostId?: string;
  /** direct reply being responded to; present only for sub-replies */
  parentReplyId?: string;
  /** stance score — replies only */
  score?: number;
  isThreadAuthor?: boolean;
  /** include userId in the public object (non-anonymous mode) */
  includePublicUserId?: boolean;
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

if (import.meta.env.DEV) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectDatabaseEmulator(db, "127.0.0.1", 9000);
  console.log("connected to firebase emulators");
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  login_hint: "user@g.ucla.edu",
  prompt: "select_account",
});

export const postsRef = ref(db, "posts");

const getSortableTimestamp = (timestamp: number | object | undefined) => {
  if (typeof timestamp === "number") return timestamp;
  // Pending server timestamp placeholders should be treated as newest.
  if (timestamp && typeof timestamp === "object")
    return Number.MAX_SAFE_INTEGER;
  return 0;
};

/**
 * creates a new post, reply, or sub-reply.
 * pass parentReplyId to write to the subreplies/ tree instead of replies/.
 */
export const createPost = async ({
  userId,
  content,
  authorDisplay,
  parentPostId,
  parentReplyId,
  score,
  isThreadAuthor,
  includePublicUserId = false,
}: CreatePostOptions) => {
  const mainTree =
    parentReplyId && parentPostId
      ? `subreplies/${parentPostId}/${parentReplyId}`
      : parentPostId
        ? `replies/${parentPostId}`
        : "posts";

  const newKey = push(child(ref(db), mainTree)).key;
  if (!newKey) return;

  const updates: Record<string, any> = {};

  if (parentReplyId && parentPostId) {
    // sub-reply: no replyCount, no interactionScore
    updates[`subreplies/${parentPostId}/${parentReplyId}/${newKey}`] = {
      id: newKey,
      ...(includePublicUserId ? { userId } : {}),
      authorDisplay,
      postContent: content,
      timestamp: serverTimestamp(),
      parentPostId,
      parentReplyId,
      ...(isThreadAuthor ? { isThreadAuthor } : {}),
    };
    updates[
      `users/${userId}/subreplies/${parentPostId}/${parentReplyId}/${newKey}`
    ] = true;
    // authorLookup for subreply
    updates[`authorLookup/${newKey}`] = {
      uid: userId,
      type: "subreply",
      postId: parentPostId,
      replyId: parentReplyId,
    };
  } else if (parentPostId) {
    // reply
    updates[`replies/${parentPostId}/${newKey}`] = {
      id: newKey,
      ...(includePublicUserId ? { userId } : {}),
      authorDisplay,
      postContent: content,
      timestamp: serverTimestamp(),
      replyCount: 0,
      parentPostId,
      interactionScore: score,
      isThreadAuthor,
    };
    updates[`users/${userId}/replies/${parentPostId}/${newKey}`] = true;
    // authorLookup for reply
    updates[`authorLookup/${newKey}`] = {
      uid: userId,
      type: "reply",
      postId: parentPostId,
    };
  } else {
    // top-level post
    updates[`posts/${newKey}`] = {
      id: newKey,
      ...(includePublicUserId ? { userId } : {}),
      authorDisplay,
      postContent: content,
      timestamp: serverTimestamp(),
      replyCount: 0,
    };
    updates[`users/${userId}/posts/${newKey}`] = true;
    // authorLookup for post
    updates[`authorLookup/${newKey}`] = {
      uid: userId,
      type: "post",
    };
  }

  await update(ref(db), updates);
  return newKey;
};

/**
 * updates content in the correct tree (posts/, replies/, or subreplies/).
 * accepts the post object directly so callers don’t thread multiple id params.
 */
export const updatePost = async (
  post: Pick<Post, "id" | "parentPostId" | "parentReplyId">,
  updates: Partial<Pick<Post, "postContent" | "editedAt">>,
) => {
  const { id, parentPostId, parentReplyId } = post;
  const path =
    parentReplyId && parentPostId
      ? `subreplies/${parentPostId}/${parentReplyId}/${id}`
      : parentPostId
        ? `replies/${parentPostId}/${id}`
        : `posts/${id}`;

  return update(ref(db), {
    [`${path}/postContent`]: updates.postContent,
    [`${path}/editedAt`]: updates.editedAt,
  });
};

/**
 * removes a post, reply, or sub-reply and cleans up all associated references atomically.
 * accepts the post object directly so callers don’t thread multiple id params.
 */
export const deletePost = async (
  post: Pick<Post, "id" | "parentPostId" | "parentReplyId">,
  userId: string,
) => {
  const { id, parentPostId, parentReplyId } = post;
  try {
    const dbUpdates: Record<string, any> = {};

    // authorLookup is flat, so we target the id directly
    dbUpdates[`authorLookup/${id}`] = null;

    if (parentReplyId && parentPostId) {
      // sub-reply: atomic delete of object + receipt
      dbUpdates[`subreplies/${parentPostId}/${parentReplyId}/${id}`] = null;
      dbUpdates[
        `users/${userId}/subreplies/${parentPostId}/${parentReplyId}/${id}`
      ] = null;
    } else if (parentPostId) {
      // reply: atomic delete of object + receipt
      dbUpdates[`replies/${parentPostId}/${id}`] = null;
      dbUpdates[`users/${userId}/replies/${parentPostId}/${id}`] = null;
    } else {
      // post: delete object + receipt
      dbUpdates[`posts/${id}`] = null;
      dbUpdates[`users/${userId}/posts/${id}`] = null;
      // cloud function handles cascade to replies/ to avoid permission errors
    }

    await update(ref(db), dbUpdates);
  } catch (error) {
    console.error("error deleting content:", error);
    throw error;
  }
};

/**
 * Fetches a single post, reply, or sub-reply by its id.
 */
export const getPostById = async (
  postId: string,
  parentPostId?: string,
  parentReplyId?: string,
): Promise<Post | null> => {
  try {
    const contentPath =
      parentReplyId && parentPostId
        ? `subreplies/${parentPostId}/${parentReplyId}/${postId}`
        : parentPostId
          ? `replies/${parentPostId}/${postId}`
          : `posts/${postId}`;

    const contentSnap = await get(ref(db, contentPath));

    if (contentSnap.exists()) {
      const data = contentSnap.val();
      return {
        id: postId,
        ...data,
        replyCount: data.replyCount || 0,
      };
    }

    return null;
  } catch (error) {
    console.error("error in getPostById:", error);
    return null;
  }
};

/**
 * subscribes to updates for a single post OR a single reply.
 */
export const subscribeToPost = (
  postId: string,
  callback: (post: Post | null) => void,
  parentPostId?: string,
  parentReplyId?: string,
) => {
  const path =
    parentReplyId && parentPostId
      ? `subreplies/${parentPostId}/${parentReplyId}/${postId}`
      : parentPostId
        ? `replies/${parentPostId}/${postId}`
        : `posts/${postId}`;

  const postRef = ref(db, path);

  return onValue(postRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      callback({
        id: postId,
        ...data,
      });
    } else {
      callback(null);
    }
  });
};

/**
 * subscribes to updates for all replies to a post.
 * ensures data is sorted chronologically and normalized.
 */
export const subscribeToReplies = (
  postId: string,
  callback: (replies: Post[]) => void,
) => {
  const repliesRef = ref(db, `replies/${postId}`);
  const q = query(repliesRef, orderByChild("timestamp"));
  return onValue(q, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const data = snapshot.val();
    const list: Post[] = Object.entries(data)
      .map(([id, val]: [string, any]) => ({
        id,
        ...val,
        replyCount: val.replyCount || 0,
      }))
      .sort(
        (a, b) =>
          getSortableTimestamp(b.timestamp) - getSortableTimestamp(a.timestamp),
      );

    callback(list);
  });
};

/**
 * Lazily subscribes to sub-replies for a given reply using a gap-loading strategy.
 * Subscribes to the oldest `topLimit` items, the newest 2 items, and an optional target item.
 */
export const subscribeToSubRepliesWithGap = (
  rootPostId: string,
  parentReplyId: string,
  topLimit: number,
  callback: (subReplies: Post[]) => void,
  targetId?: string | null,
) => {
  const subRepliesRef = ref(db, `subreplies/${rootPostId}/${parentReplyId}`);

  const qTop = query(
    subRepliesRef,
    orderByChild("timestamp"),
    limitToFirst(topLimit),
  );
  const qBottom = query(
    subRepliesRef,
    orderByChild("timestamp"),
    limitToLast(2),
  );

  let topData: Record<string, any> | null = null;
  let bottomData: Record<string, any> | null = null;
  // wait for target data if an ID is provided
  let targetData: Record<string, any> | null = targetId ? null : {};

  const emit = () => {
    if (topData === null || bottomData === null || targetData === null) return;

    const mergedData = { ...topData, ...bottomData, ...targetData };
    const list: Post[] = Object.entries(mergedData)
      .map(([id, val]: [string, any]) => ({
        id,
        ...val,
        parentPostId: rootPostId,
        parentReplyId,
      }))
      .sort(
        (a, b) =>
          getSortableTimestamp(a.timestamp) - getSortableTimestamp(b.timestamp),
      );

    callback(list);
  };

  const unsubTop = onValue(qTop, (snapshot) => {
    topData = snapshot.exists() ? snapshot.val() : {};
    emit();
  });

  const unsubBottom = onValue(qBottom, (snapshot) => {
    bottomData = snapshot.exists() ? snapshot.val() : {};
    emit();
  });

  let unsubTarget = () => {};
  if (targetId) {
    unsubTarget = onValue(child(subRepliesRef, targetId), (snapshot) => {
      targetData = snapshot.exists() ? { [targetId]: snapshot.val() } : {};
      emit();
    });
  }

  return () => {
    unsubTop();
    unsubBottom();
    unsubTarget();
  };
};

/**
 * subscribes to the main feed of top-level posts.
 */
export const subscribeToFeed = (
  limitCount: number,
  callback: (posts: Post[]) => void,
) => {
  const postsRef = ref(db, "posts");
  const postsQuery = query(
    postsRef,
    orderByChild("timestamp"),
    limitToLast(limitCount),
  );

  return onValue(postsQuery, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const postsObject = snapshot.val();
    const postsArray: Post[] = Object.entries(postsObject)
      .map(([postId, postData]: [string, any]) => ({
        id: postId,
        authorDisplay: postData.authorDisplay,
        postContent: postData.postContent || postData.content,
        timestamp: postData.timestamp || 0,
        editedAt: postData.editedAt,
        replyCount: postData.replyCount || 0,
        parentPostId: postData.parentPostId,
      }))
      .filter((post) => post.postContent && !post.parentPostId)
      .sort(
        (a, b) =>
          getSortableTimestamp(b.timestamp) - getSortableTimestamp(a.timestamp),
      );

    callback(postsArray);
  });
};

/**
 * subscribes to auth state changes.
 */
export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * handles google sign-in with ucla-only email restriction logic.
 */
export const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    // sign user out locally to clear partially authenticated state
    await auth.signOut();
    throw error;
  }
};

/**
 * signs the current user out.
 */
export const signOutUser = () => signOut(auth);

/**
 * fetches data required for deep-linking based on post, parent, and root ids.
 */
export const getDeepLinkData = async (
  sharedId: string,
  parentId?: string | null,
  rootId?: string | null,
) => {
  // fetch the target item (could be post, reply, or sub-reply)
  const targetPost = await getPostById(
    sharedId,
    parentId || undefined,
    rootId || undefined,
  );
  if (!targetPost) return null;

  // it's a sub-reply (r and p exist)
  if (rootId && parentId) {
    const root = await getPostById(rootId);
    if (root) {
      return {
        displayPost: root,
        highlightReplyId: parentId,
        highlightSubReplyId: sharedId,
      };
    }
  }

  // it's a regular reply (p exists)
  if (parentId) {
    const parent = await getPostById(parentId);
    if (parent) {
      return {
        displayPost: parent,
        highlightReplyId: sharedId,
        highlightSubReplyId: null,
      };
    }
  }

  // a top-level post
  return {
    displayPost: targetPost,
    highlightReplyId: null,
    highlightSubReplyId: null,
  };
};

/**
 * fetches user activity and performs lazy cleanup on dangling receipts in users tree.
 */
export const getUserActivity = async (
  userId: string,
  filter: "posts" | "replies" | "subreplies",
): Promise<Post[]> => {
  try {
    const snapshot = await get(ref(db, `users/${userId}/${filter}`));
    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    const deadReceipts: Record<string, null> = {};
    const tasks: Promise<Post | null>[] = [];

    if (filter === "posts") {
      Object.keys(data).forEach((id) => {
        tasks.push(
          (async () => {
            const post = await getPostById(id);
            if (!post) deadReceipts[`users/${userId}/posts/${id}`] = null;
            return post;
          })(),
        );
      });
    } else if (filter === "replies") {
      Object.entries(data).forEach(([parentId, replies]) => {
        Object.keys(replies as object).forEach((id) => {
          tasks.push(
            (async () => {
              const reply = await getPostById(id, parentId);
              if (!reply) {
                deadReceipts[`users/${userId}/replies/${parentId}/${id}`] =
                  null;
                return null;
              }
              const parent = await getPostById(parentId);
              return { ...reply, parentPost: parent ?? undefined };
            })(),
          );
        });
      });
    } else {
      // Subreplies: Fetch the direct parent (the reply) for context
      Object.entries(data).forEach(([postId, replyGroup]) => {
        Object.entries(replyGroup as object).forEach(
          ([replyId, subReplies]) => {
            Object.keys(subReplies as object).forEach((id) => {
              tasks.push(
                (async () => {
                  const subReply = await getPostById(id, postId, replyId);
                  if (!subReply) {
                    deadReceipts[
                      `users/${userId}/subreplies/${postId}/${replyId}/${id}`
                    ] = null;
                    return null;
                  }
                  // For sub-replies, we fetch the reply they responded to as the 'parentPost' context
                  const parentReply = await getPostById(replyId, postId);
                  return { ...subReply, parentPost: parentReply ?? undefined };
                })(),
              );
            });
          },
        );
      });
    }

    const results = await Promise.all(tasks);

    // perform atomic cleanup of identified orphans
    if (Object.keys(deadReceipts).length > 0) {
      update(ref(db), deadReceipts).catch((e) =>
        console.error("lazy cleanup failed:", e),
      );
    }

    return results
      .filter((p): p is Post => p !== null)
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
  } catch (error) {
    console.error(`error fetching ${filter}:`, error);
    return [];
  }
};

/**
 * Subscribes to posts and replies for a user.
 */
export const subscribeToUserCounts = (
  userId: string,
  callback: (counts: UserCounts) => void,
) => {
  const userRef = `users/${userId}`;
  const currentCounts: UserCounts = { posts: 0, replies: 0, interacted: 0 };

  // Tracks counts for the two separate reply branches
  let standardRepliesCount = 0;
  let subRepliesCount = 0;

  const emit = () => {
    currentCounts.replies = standardRepliesCount + subRepliesCount;
    callback({ ...currentCounts });
  };

  const postsUnsub = onValue(ref(db, `${userRef}/posts`), (snapshot) => {
    currentCounts.posts = snapshot.size;
    emit();
  });

  const repliesUnsub = onValue(ref(db, `${userRef}/replies`), (snapshot) => {
    let total = 0;
    snapshot.forEach((threadSnap) => {
      total += threadSnap.size;
    });
    standardRepliesCount = total;
    emit();
  });

  const subRepliesUnsub = onValue(
    ref(db, `${userRef}/subreplies`),
    (snapshot) => {
      let total = 0;
      // Nesting: postId -> replyId -> subReplyId
      snapshot.forEach((postGroup) => {
        postGroup.forEach((replyGroup) => {
          total += replyGroup.size;
        });
      });
      subRepliesCount = total;
      emit();
    },
  );

  return () => {
    postsUnsub();
    repliesUnsub();
    subRepliesUnsub();
  };
};

/**
 * Subscribes to all notifications for a specific user.
 * Groups data and sorts by the latest update.
 */
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: any[]) => void,
) => {
  const notifRef = ref(db, `users/${userId}/notifications`);
  // Sort by updatedAt so newest notifications are at the top
  const q = query(notifRef, orderByChild("updatedAt"));

  return onValue(q, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const data = snapshot.val();
    const list = Object.entries(data)
      .map(([id, val]: [string, any]) => ({
        id,
        ...val,
      }))
      // Reverse because limitToLast/orderByChild returns ascending
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    callback(list);
  });
};

/**
 * Marks a specific notification as read.
 */
export const markNotificationAsRead = async (
  userId: string,
  notificationId: string,
) => {
  const path = `users/${userId}/notifications/${notificationId}/isRead`;
  return update(ref(db), { [path]: true });
};

/**
 * Marks ALL notifications as read for a user.
 */
export const markAllNotificationsAsRead = async (
  userId: string,
  notificationIds: string[],
) => {
  const updates: Record<string, boolean> = {};
  notificationIds.forEach((id) => {
    updates[`users/${userId}/notifications/${id}/isRead`] = true;
  });
  return update(ref(db), updates);
};

/**
 * Deletes a specific notification or a batch of notifications.
 */
export const deleteNotifications = async (
  userId: string,
  notificationIds: string[],
) => {
  const updates: Record<string, null> = {};
  notificationIds.forEach((id) => {
    updates[`users/${userId}/notifications/${id}`] = null;
  });
  return update(ref(db), updates);
};
