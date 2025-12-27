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
} from "firebase/database";

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
 * Atomic update to add or remove an interaction.
 */
const setInteraction = async (
  postId: string,
  uid: string,
  type: "agreed" | "dissented",
  value: true | null,
) => {
  const updates: Record<string, any> = {
    [`users/${uid}/postInteractions/${type}/${postId}`]: value,
    [`posts/${postId}/userInteractions/${type}/${uid}`]: value,
  };

  return update(ref(db), updates);
};

export const addInteraction = (
  postId: string,
  uid: string,
  type: "agreed" | "dissented",
) => setInteraction(postId, uid, type, true);

export const removeInteraction = (
  postId: string,
  uid: string,
  type: "agreed" | "dissented",
) => setInteraction(postId, uid, type, null);

/**
 * Creates a new post or a reply.
 * logical separation between top-level posts and nested replies.
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
    metrics: { agreedCount: 0, dissentedCount: 0, replyCount: 0 },
    userInteractions: { agreed: {}, dissented: {} },
    ...(parentPostId && { parentPostId, userInteractionType: stance }),
  };

  const updates: Record<string, any> = {};

  if (parentPostId) {
    updates[`replies/${parentPostId}/${newKey}`] = postData;
    updates[`posts/${parentPostId}/replyIds/${newKey}`] = true;
  } else {
    updates[`posts/${newKey}`] = postData;
  }

  return update(ref(db), updates);
};

/**
 * Updates content in the correct tree.
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
 * Removes a post or reply and cleans up all associated references atomically.
 */
export const deletePost = async (postId: string, parentPostId?: string) => {
  try {
    const updates: Record<string, any> = {};

    if (parentPostId) {
      // reply deletion: remove from the specific post's reply tree
      updates[`replies/${parentPostId}/${postId}`] = null;
      updates[`posts/${parentPostId}/replyIds/${postId}`] = null;
    } else {
      // top-level deletion: wipe the post and the entire associated reply tree
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
