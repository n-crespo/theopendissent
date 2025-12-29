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
  apiKey: "AIzaSyBqrAeqFnJLS8GRVR1LJvlUJ_TYao-EPe0",
  authDomain: "auth.theopendissent.com",
  databaseURL: "https://test-app-d0afd-default-rtdb.firebaseio.com",
  projectId: "test-app-d0afd",
  storageBucket: "test-app-d0afd.firebasestorage.app",
  messagingSenderId: "772131437162",
  appId: "1:772131437162:web:29b3407e82adeb28942813",
};

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
 * creates a new post or a reply.
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
  } else {
    updates[`posts/${newKey}`] = postData;
  }

  return update(ref(db), updates);
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
export const deletePost = async (postId: string, parentPostId?: string) => {
  try {
    const updates: Record<string, any> = {};

    if (parentPostId) {
      updates[`replies/${parentPostId}/${postId}`] = null;
    } else {
      updates[`posts/${postId}`] = null;
      updates[`replies/${postId}`] = null;
    }

    await update(ref(db), updates);
  } catch (error) {
    console.error("error deleting content:", error);
    throw error;
  }
};

/**
 * Fetches a single post/reply by ID. Requires parentPostId if the target is a
 * reply.
 */
export const getPostById = async (
  postId: string,
  parentPostId?: string,
): Promise<Post | null> => {
  try {
    const contentPath = parentPostId
      ? `replies/${parentPostId}/${postId}`
      : `posts/${postId}`;

    const contentSnap = await get(ref(db, contentPath));

    if (contentSnap.exists()) {
      return { id: postId, ...contentSnap.val() };
    }

    return null;
  } catch (error) {
    console.error("error in getPostById:", error);
    return null;
  }
};

/**
 * subscribes to updates for a single post.
 */
export const subscribeToPost = (
  postId: string,
  callback: (post: Post | null) => void,
) => {
  const postRef = ref(db, `posts/${postId}`);
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
      // sort by timestamp ascending for conversation flow
      .sort((a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0));

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
    if (error.code === "auth/internal-error") {
      alert(
        "Sorry... only @g.ucla.edu emails are allowed to sign up right now.",
      );
    }
    console.error("sign-in failed:", error.message);
    throw error;
  }
};

/**
 * signs the current user out.
 */
export const logoutUser = () => signOut(auth);
