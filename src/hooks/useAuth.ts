import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { subscribeToAuth, signInWithGoogle, logoutUser } from "../lib/firebase";

/**
 * manages authenticated user state and auth actions.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // listener setup
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return {
    user,
    loading,
    signIn: signInWithGoogle,
    logout: logoutUser,
  };
}
