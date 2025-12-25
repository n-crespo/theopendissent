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
googleProvider.setCustomParameters({ login_hint: "user@g.ucla.edu" });

export const postsRef = ref(db, "posts");

/**
 * creates a new post or a reply to an existing post
 */
export const createPost = async (
  userId: string,
  content: string,
  parentPostId?: string,
) => {
  // generate a unique ID for the new post
  const newPostKey = push(child(ref(db), "posts")).key;
  if (!newPostKey) return;

  const postData = {
    id: newPostKey,
    userId,
    postContent: content,
    timestamp: serverTimestamp(),
    metrics: {
      agreedCount: 0,
      dissentedCount: 0,
    },
    userInteractions: {
      agreed: {},
      dissented: {},
    },
    // only include this if it's actually a reply
    ...(parentPostId && { parentPostId }),
  };

  const updates: Record<string, any> = {
    [`posts/${newPostKey}`]: postData,
  };

  // if it's a reply, link it to the parent atomically
  if (parentPostId) {
    updates[`posts/${parentPostId}/replyIds/${newPostKey}`] = true;
  }

  return update(ref(db), updates);
};

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
 * Updates a post's content and sets the edited timestamp
 */
export const updatePost = async (
  postId: string,
  updates: Partial<Pick<Post, "postContent" | "editedAt">>,
) => {
  try {
    const postRef = ref(db, `posts/${postId}`);

    // we use update here to keep existing metrics and interactions intact
    await update(postRef, updates);
  } catch (error) {
    console.error("error updating post:", error);
    throw error;
  }
};

/**
 * Removes a post and cleans up top-level references
 */
export const deletePost = async (postId: string, uid: string) => {
  try {
    const updates: Record<string, any> = {
      [`posts/${postId}`]: null,
      [`users/${uid}/postInteractions/agreed/${postId}`]: null,
      [`users/${uid}/postInteractions/dissented/${postId}`]: null,
    };

    // use update at root for atomic deletion
    await update(ref(db), updates);
  } catch (error) {
    console.error("error deleting post:", error);
    throw error;
  }
};
