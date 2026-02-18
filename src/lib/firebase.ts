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

/**
 * atomic update to add or remove an interaction score in the user's tree.
 * cloud function handles syncing this to the public post/reply.
 */
export const setInteraction = async (
  postId: string,
  uid: string,
  score: number | null, // set to null to remove
) => {
  const updates: Record<string, any> = {
    [`users/${uid}/postInteractions/${postId}`]: score,
  };

  return update(ref(db), updates);
};

/**
 * creates a new post or a reply.
 */
export const createPost = async (
  userId: string,
  content: string,
  parentPostId?: string,
  score?: number,
) => {
  const mainTree = parentPostId ? `replies/${parentPostId}` : "posts";
  const newKey = push(child(ref(db), mainTree)).key;
  if (!newKey) return;

  const postData = {
    id: newKey,
    userId,
    postContent: content,
    timestamp: serverTimestamp(),
    replyCount: 0,
    userInteractions: {},
    ...(parentPostId && { parentPostId, interactionScore: score }),
  };

  const updates: Record<string, any> = {};

  if (parentPostId) {
    updates[`replies/${parentPostId}/${newKey}`] = postData;
    // Store reference in user's profile: users/UID/replies/PARENT_ID/REPLY_ID = true
    updates[`users/${userId}/replies/${parentPostId}/${newKey}`] = true;
  } else {
    updates[`posts/${newKey}`] = postData;
    // Store reference in user's profile: users/UID/posts/POST_ID = true
    updates[`users/${userId}/posts/${newKey}`] = true;
  }

  update(ref(db), updates);
  return newKey;
};

/**
 * updates content in the correct tree.
 */
export const updatePost = async (
  postId: string,
  updates: Partial<Pick<Post, "postContent" | "editedAt">>,
  parentPostId?: string,
) => {
  const path = parentPostId
    ? `replies/${parentPostId}/${postId}`
    : `posts/${postId}`;

  const multiUpdates: Record<string, any> = {
    [`${path}/postContent`]: updates.postContent,
    [`${path}/editedAt`]: updates.editedAt,
  };

  return update(ref(db), multiUpdates);
};

/**
 * removes a post or reply and cleans up all associated references atomically.
 */
export const deletePost = async (
  postId: string,
  userId: string, // need userId to find the reference in users/ node
  parentPostId?: string,
) => {
  try {
    const updates: Record<string, any> = {};

    if (parentPostId) {
      // Remove data
      updates[`replies/${parentPostId}/${postId}`] = null;
      // Remove user reference
      updates[`users/${userId}/replies/${parentPostId}/${postId}`] = null;
    } else {
      // Remove data
      updates[`posts/${postId}`] = null;
      updates[`replies/${postId}`] = null; // Delete all replies to this post
      // Remove user reference
      updates[`users/${userId}/posts/${postId}`] = null;
    }

    await update(ref(db), updates);
  } catch (error) {
    console.error("error deleting content:", error);
    throw error;
  }
};

/**
 * Fetches a single post or reply by its id.
 */
export const getPostById = async (
  postId: string,
  parentPostId?: string,
): Promise<Post | null> => {
  try {
    // determine path based on whether parent id is provided
    const contentPath = parentPostId
      ? `replies/${parentPostId}/${postId}`
      : `posts/${postId}`;

    const contentSnap = await get(ref(db, contentPath));

    if (contentSnap.exists()) {
      const data = contentSnap.val();
      return {
        id: postId,
        ...data,
        // normalize fields to match the post type structure
        replyCount: data.replyCount || 0,
        userInteractions: data.userInteractions || {},
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
        userInteractions: data.userInteractions || {},
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
        userInteractions: val.userInteractions || {},
      }))
      .sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));

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
        postContent: postData.postContent || postData.content,
        timestamp: postData.timestamp || 0,
        editedAt: postData.editedAt,
        replyCount: postData.replyCount || 0,
        userInteractions: postData.userInteractions || {},
        parentPostId: postData.parentPostId,
      }))
      .filter((post) => post.postContent && !post.parentPostId)
      .sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));

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
export const logoutUser = () => signOut(auth);

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
 * Fetches lists of content based on user profile filters.
 */
export const getUserActivity = async (
  userId: string,
  filter: "posts" | "replies" | "interacted",
): Promise<Post[]> => {
  try {
    let indexRef;
    if (filter === "posts") {
      indexRef = ref(db, `users/${userId}/posts`);
    } else if (filter === "replies") {
      indexRef = ref(db, `users/${userId}/replies`);
    } else {
      indexRef = ref(db, `users/${userId}/postInteractions`);
    }

    const snapshot = await get(indexRef);
    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    const promises: Promise<Post | null>[] = [];

    // Iterate keys and queue up fetches
    if (filter === "posts") {
      Object.keys(data).forEach((postId) => {
        promises.push(getPostById(postId));
      });
    } else if (filter === "replies") {
      // data is { parentId: { replyId: true } }
      Object.entries(data).forEach(([parentId, repliesObj]: [string, any]) => {
        Object.keys(repliesObj).forEach((replyId) => {
          // Fetch Reply AND Parent
          const fetchWithParent = async () => {
            const reply = await getPostById(replyId, parentId);
            if (!reply) return null;

            // Fetch parent for context
            const parent = await getPostById(parentId);
            // Attach parent to the reply object
            // We cast as any or extend the type locally in the component
            return { ...reply, parentPost: parent || undefined };
          };
          promises.push(fetchWithParent());
        });
      });
    } else {
      // TODO: remove interacations on replies for now?

      // UPDATED: Filter is 'interacted' (the map is postId -> score)
      // Note: We don't store parentId in the user's interaction map anymore (it's just a number)
      // So we have to check content_parents to find the parent ID if it's a reply
      Object.keys(data).forEach((itemId) => {
        const fetchContent = async () => {
          // 1. Try fetching as top-level post first
          let item = await getPostById(itemId);

          // 2. If null, it might be a reply. Look up parent via content_parents index (not available on client directly without exposed ref)
          // Since we can't easily check content_parents from here without a new index or rule,
          // we can try fetching from a known path or rely on the fact that most interactions are on posts.
          // *Refinement*: For now, let's assume interactions are primarily on posts.
          // If we need to support reply interactions in profile, we'd need to expose the `content_parents` index to the client.

          // For now, let's try a heuristic or just return the post if found.
          if (item) return item;

          return null;
        };
        promises.push(fetchContent());
      });
    }

    const results = await Promise.all(promises);

    // Filter nulls and sort by timestamp descending
    return results
      .filter((post): post is Post => post !== null)
      .sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
  } catch (error) {
    console.error(`Error fetching user activity for ${filter}:`, error);
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

  // Interactions Listener
  const interactionsUnsub = onValue(
    ref(db, `${userRef}/postInteractions`),
    (snapshot) => {
      currentCounts.interacted = snapshot.size; // Just count total number of keys in the map
      emit();
    },
  );

  // Return a master unsubscribe function
  return () => {
    postsUnsub();
    repliesUnsub();
    interactionsUnsub();
  };
};
