import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBqrAeqFnJLS8GRVR1LJvlUJ_TYao-EPe0",
  authDomain: "test-app-d0afd.firebaseapp.com",
  databaseURL: "https://test-app-d0afd-default-rtdb.firebaseio.com",
  projectId: "test-app-d0afd",
  storageBucket: "test-app-d0afd.firebasestorage.app",
  messagingSenderId: "772131437162",
  appId: "1:772131437162:web:29b3407e82adeb28942813",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// --- Core Authentication Functions ---

export function setupAuthListeners(onSignedIn, onSignedOut) {
  onAuthStateChanged(auth, (user) => {
    // User is signed in
    if (user) {
      console.log("User signed in:", user.displayName);
      onSignedIn(user);
    } else {
      // User is signed out
      console.log("User signed out.");
      onSignedOut();
    }
  });

  // Attach Google Sign-In handler to the button
  document
    .getElementById("google-sign-in-btn")
    ?.addEventListener("click", () => {
      signInWithPopup(auth, provider)
        .then((result) => {
          // Successful sign-in, onAuthStateChanged will handle the UI update
        })
        .catch((error) => {
          // Handle Errors here.
          console.log(error);
          console.error("Google Sign-In Error:", error.message);
        });
    });
}
