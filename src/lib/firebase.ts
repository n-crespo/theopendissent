import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { Post } from "../types/index.ts";

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
} from "firebase/auth";

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
  agreed: number;
  dissented: number;
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  login_hint: "user@g.ucla.edu",
  prompt: "select_account",
});

export const postsRef = ref(db, "posts");

/**
 * atomic update to add or remove an interaction in the user's tree.
 * cloud function handles syncing this to the public post/reply and metrics.
 * stores the parent ID as a string so the cloud function can resolve paths.
 */
const setInteraction = async (
  postId: string,
  uid: string,
  type: "agreed" | "dissented",
  value: true | null,
  parentPostId?: string,
) => {
  const updates: Record<string, any> = {
    // value is the parent ID string or "top"
    [`users/${uid}/postInteractions/${type}/${postId}`]: value
      ? parentPostId || "top"
      : null,
  };

  return update(ref(db), updates);
};

export const addInteraction = (
  postId: string,
  uid: string,
  type: "agreed" | "dissented",
  parentPostId?: string,
) => setInteraction(postId, uid, type, true, parentPostId);

export const removeInteraction = (
  postId: string,
  uid: string,
  type: "agreed" | "dissented",
  parentPostId?: string,
) => setInteraction(postId, uid, type, null, parentPostId);

/**
 * creates a new post or a reply. also writes an index to users/{uid} for
 * performant profile querying.
 */
export const createPost = async (
  userId: string,
  content: string,
  parentPostId?: string,
  stance?: "agreed" | "dissented",
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
    userInteractions: { agreed: {}, dissented: {} },
    ...(parentPostId && { parentPostId, userInteractionType: stance }),
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
        userInteractions: data.userInteractions || {
          agreed: {},
          dissented: {},
        },
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
        userInteractions: data.userInteractions || {
          agreed: {},
          dissented: {},
        },
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
        userInteractions: val.userInteractions || { agreed: {}, dissented: {} },
      }))
      // sort by timestamp descending (Newest First)
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
        userInteractions: {
          agreed: postData.userInteractions?.agreed || {},
          dissented: postData.userInteractions?.dissented || {},
        },
        parentPostId: postData.parentPostId,
      }))
      // filter out replies and invalid content
      .filter((post) => post.postContent && !post.parentPostId)
      // newest first
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
 * Handles the "Fan-out" reading:
 * 1. Get list of IDs from users/{uid}
 * 2. Fetch actual content for each ID in parallel
 */
export const getUserActivity = async (
  userId: string,
  filter: "posts" | "replies" | "agreed" | "dissented",
): Promise<Post[]> => {
  try {
    // Determine where to look for the IDs
    let indexRef;
    if (filter === "posts") {
      indexRef = ref(db, `users/${userId}/posts`);
    } else if (filter === "replies") {
      indexRef = ref(db, `users/${userId}/replies`);
    } else {
      indexRef = ref(db, `users/${userId}/postInteractions/${filter}`);
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
      // filter is "agreed" or "dissented"
      Object.entries(data).forEach(
        ([itemId, parentReference]: [string, any]) => {
          const parentId =
            parentReference === "top" ? undefined : parentReference;
          promises.push(getPostById(itemId, parentId));
        },
      );
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
 * Fetches count of items for all profile tabs.
 * Uses the index nodes (users/{uid}/...) to avoid downloading full post content.
 */
export const getUserCounts = async (userId: string) => {
  try {
    const userRef = `users/${userId}`;

    // Fetch all 3 index nodes in parallel
    const [postsSnap, repliesSnap, interactionsSnap] = await Promise.all([
      get(ref(db, `${userRef}/posts`)),
      get(ref(db, `${userRef}/replies`)),
      get(ref(db, `${userRef}/postInteractions`)),
    ]);

    // Posts Count
    const posts = postsSnap.exists() ? Object.keys(postsSnap.val()).length : 0;

    // Replies Count (Nested: parentId -> replyId)
    let replies = 0;
    if (repliesSnap.exists()) {
      const repliesData = repliesSnap.val();
      Object.values(repliesData).forEach((thread: any) => {
        replies += Object.keys(thread).length;
      });
    }

    // Interactions Count
    const interactionsData = interactionsSnap.val() || {};
    const agreed = interactionsData.agreed
      ? Object.keys(interactionsData.agreed).length
      : 0;
    const dissented = interactionsData.dissented
      ? Object.keys(interactionsData.dissented).length
      : 0;

    return { posts, replies, agreed, dissented };
  } catch (error) {
    console.error("Error fetching user counts:", error);
    return { posts: 0, replies: 0, agreed: 0, dissented: 0 };
  }
};

/**
 * Subscribes to posts, replies, and interactions counts for a user.
 * Aggregates updates from 3 different listeners into a single callback.
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
    agreed: 0,
    dissented: 0,
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
      const data = snapshot.val() || {};
      currentCounts.agreed = data.agreed ? Object.keys(data.agreed).length : 0;
      currentCounts.dissented = data.dissented
        ? Object.keys(data.dissented).length
        : 0;
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
