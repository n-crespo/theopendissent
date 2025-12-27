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
  // remove,
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
 * atomic update to add or remove an interaction
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
) => setInteraction(postId, uid, type, null); // passing null deletes the key in Firebase

/**
 * Creates a new post or a reply to an existing post.
 * stance is required for replies to satisfy security rules.
 */
export const createPost = async (
  userId: string,
  content: string,
  parentPostId?: string,
  stance?: "agreed" | "dissented", // added to satisfy rules
) => {
  const newPostKey = push(child(ref(db), "posts")).key;
  if (!newPostKey) return;

  const postData = {
    id: newPostKey,
    userId,
    postContent: content,
    timestamp: serverTimestamp(),
    metrics: { agreedCount: 0, dissentedCount: 0 },
    userInteractions: { agreed: {}, dissented: {} },
    ...(parentPostId && { parentPostId }),
    ...(parentPostId && stance && { userInteractionType: stance }),
  };

  const updates: Record<string, any> = {
    [`posts/${newPostKey}`]: postData,
  };

  if (parentPostId) {
    updates[`posts/${parentPostId}/replyIds/${newPostKey}`] = true;
    // this path requires userInteractionType for validation to pass
    updates[`replies/${parentPostId}/${newPostKey}`] = postData;
  }

  return update(ref(db), updates);
};

/**
 * updates a post's content and sets the edited timestamp.
 * handles both top-level posts and replies in the replies/ tree.
 */
export const updatePost = async (
  postId: string,
  updates: Partial<Pick<Post, "postContent" | "editedAt">>,
  parentPostId?: string,
) => {
  try {
    console.log("trying to update post");
    console.log(updates);
    const multiUpdates: Record<string, any> = {
      [`posts/${postId}/postContent`]: updates.postContent,
      [`posts/${postId}/editedAt`]: updates.editedAt,
    };

    // if it's a reply, we must also update the source of truth in the replies tree
    if (parentPostId) {
      multiUpdates[`replies/${parentPostId}/${postId}/postContent`] =
        updates.postContent;
      multiUpdates[`replies/${parentPostId}/${postId}/editedAt`] =
        updates.editedAt;
    }

    await update(ref(db), multiUpdates);
  } catch (error) {
    console.error("error updating post:", error);
    throw error;
  }
};

/**
 * removes a post or reply and cleans up all associated references atomically
 */
export const deletePost = async (postId: string, parentPostId?: string) => {
  try {
    const updates: Record<string, any> = {};

    // delete main post entry
    updates[`posts/${postId}`] = null;

    if (parentPostId) {
      // 1. remove from parent's index in /posts/
      updates[`posts/${parentPostId}/replyIds/${postId}`] = null;
      // 2. remove from the dedicated /replies/ tree
      // this triggers the updateReplyCount Cloud Function
      updates[`replies/${parentPostId}/${postId}`] = null;
    } else {
      // if it's a main post, wipe the entire replies sub-tree
      updates[`replies/${postId}`] = null;
    }

    await update(ref(db), updates);
  } catch (error) {
    console.error("error deleting content:", error);
    throw error;
  }
};
