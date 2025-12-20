// src/hooks/useAuth.ts
import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // sets up the listener once when the app starts
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === "auth/internal-error") {
        alert(
          "Sorry... only @g.ucla.edu emails are allowed to sign up right now.",
        );
      }
      console.error("Sign-in failed:", error.message);
    }
  };

  const logout = () => signOut(auth);

  return { user, loading, signIn, logout };
}
