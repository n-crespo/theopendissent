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
export const createPost = async (
  userId: string,
  content: string,
  authorDisplay: string,
  parentPostId?: string,
  score?: number,
  isThreadAuthor?: boolean,
  includePublicUserId = false,
  parentReplyId?: string,
) => {
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
  }

  await update(ref(db), updates);
  return newKey;
};

/**
 * updates content in the correct tree (posts/, replies/, or subreplies/).
 */
export const updatePost = async (
  postId: string,
  updates: Partial<Pick<Post, "postContent" | "editedAt">>,
  parentPostId?: string,
  parentReplyId?: string,
) => {
  const path =
    parentReplyId && parentPostId
      ? `subreplies/${parentPostId}/${parentReplyId}/${postId}`
      : parentPostId
        ? `replies/${parentPostId}/${postId}`
        : `posts/${postId}`;

  const multiUpdates: Record<string, any> = {
    [`${path}/postContent`]: updates.postContent,
    [`${path}/editedAt`]: updates.editedAt,
  };

  return update(ref(db), multiUpdates);
};

/**
 * removes a post, reply, or sub-reply and cleans up all associated references atomically.
 */
export const deletePost = async (
  postId: string,
  userId: string,
  parentPostId?: string,
  parentReplyId?: string,
) => {
  try {
    const updates: Record<string, any> = {};

    if (parentReplyId && parentPostId) {
      // sub-reply: atomic delete of object + receipt
      updates[`subreplies/${parentPostId}/${parentReplyId}/${postId}`] = null;
      updates[
        `users/${userId}/subreplies/${parentPostId}/${parentReplyId}/${postId}`
      ] = null;
    } else if (parentPostId) {
      // reply: atomic delete of object + receipt
      updates[`replies/${parentPostId}/${postId}`] = null;
      updates[`users/${userId}/replies/${parentPostId}/${postId}`] = null;
    } else {
      // post: delete object + receipt
      updates[`posts/${postId}`] = null;
      updates[`users/${userId}/posts/${postId}`] = null;
      // cloud function handles cascade to replies/ to avoid permission errors
    }

    await update(ref(db), updates);
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
) => {
  // If parentPostId exists, look in replies tree. Otherwise, look in posts tree.
  const path = parentPostId
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
 * Lazily subscribes to sub-replies for a given reply.
 * Re-call with a higher limit to load more ("load more" button).
 * Sub-replies are sorted oldest-first (chronological reading order).
 */
export const subscribeToSubReplies = (
  rootPostId: string,
  parentReplyId: string,
  limit: number,
  callback: (subReplies: Post[]) => void,
) => {
  const subRepliesRef = ref(db, `subreplies/${rootPostId}/${parentReplyId}`);
  const q = query(
    subRepliesRef,
    orderByChild("timestamp"),
    limitToFirst(limit),
  );

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
        parentPostId: rootPostId,
        parentReplyId,
      }))
      .sort(
        (a, b) =>
          getSortableTimestamp(a.timestamp) - getSortableTimestamp(b.timestamp),
      );

    callback(list);
  });
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
        userId: postData.userId,
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
 * fetches data required for deep-linking based on post and parent ids.
 */
export const getDeepLinkData = async (
  sharedId: string,
  parentId?: string | null,
) => {
  // if p exists, we are looking for a reply. if not, a top-level post.
  const targetPost = await getPostById(sharedId, parentId || undefined);
  if (!targetPost) return null;

  if (parentId) {
    const parent = await getPostById(parentId);
    if (parent) {
      return { displayPost: parent, highlightReplyId: sharedId };
    }
  }

  return { displayPost: targetPost, highlightReplyId: null };
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
      // subreplies: 3-level receipt structure — postId → replyId → subReplyId
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
                  return subReply;
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
 * Subscribes to posts, replies, and interacted counts for a user.
 */
export const subscribeToUserCounts = (
  userId: string,
  callback: (counts: UserCounts) => void,
) => {
  const userRef = `users/${userId}`;

  // Local cache to hold the latest values from each listener
  const currentCounts: UserCounts = {
    posts: 0,
    replies: 0,
    interacted: 0,
  };

  // Helper to trigger the callback with a copy of current data
  const emit = () => callback({ ...currentCounts });

  // Posts Listener
  const postsUnsub = onValue(ref(db, `${userRef}/posts`), (snapshot) => {
    currentCounts.posts = snapshot.size;
    emit();
  });

  // Replies Listener (Nested counting)
  const repliesUnsub = onValue(ref(db, `${userRef}/replies`), (snapshot) => {
    let total = 0;
    snapshot.forEach((threadSnap) => {
      total += threadSnap.size;
    });
    currentCounts.replies = total;
    emit();
  });

  // Return a master unsubscribe function
  return () => {
    postsUnsub();
    repliesUnsub();
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
