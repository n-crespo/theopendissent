import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase, ref, update } from "firebase/database";

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

// generic helper
export const toggleInteraction = async (
  postId: string,
  uid: string,
  interactionType: string,
  isRemoving: boolean,
) => {
  const value = isRemoving ? null : true;

  const updates: Record<string, any> = {
    [`users/${uid}/postInteractions/${interactionType}/${postId}`]: value,
    [`posts/${postId}/userInteractions/${interactionType}/${uid}`]: value,
  };

  return update(ref(db), updates);
};

// add these specific exports that PostItem is looking for
export const addInteraction = (postId: string, uid: string, type: string) =>
  toggleInteraction(postId, uid, type, false);

export const removeInteraction = (postId: string, uid: string, type: string) =>
  toggleInteraction(postId, uid, type, true);
