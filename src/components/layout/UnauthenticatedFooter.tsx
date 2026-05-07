import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { LoadingDots } from "../ui/LoadingDots";
import { motion } from "framer-motion";

export const UnauthenticatedFooter = () => {
  const { signIn } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      await signIn();
      sessionStorage.setItem("justLoggedIn", "true");
    } catch (err: any) {
      console.error("Sign in failed:", err);
      if (err.code === "auth/internal-error" || err.message?.includes("ucla")) {
        setError("Only UCLA emails allowed.");
      } else {
        setError("Sign in failed.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "anticipate" }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-logo-offwhite border-t border-slate-300 shadow-2xl rounded-t-4xl transform-gpu"
    >
      <div className="mx-auto max-w-7xl px-4 py-7 pb-6 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col">
          <p className="text-slate-900 text-md font-semibold sm:text-base leading-tight">
            Sign in with your UCLA email to post or reply!
          </p>
          {error && (
            <p className="text-(--disagree) text-xs mt-1 animate-in fade-in">
              {error}
            </p>
          )}
        </div>

        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-logo-red via-logo-green to-logo-blue animate-shimmer bg-size-[200%_auto] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0073e6] disabled:opacity-70 active:scale-95 whitespace-nowrap"
        >
          {isSigningIn ? (
            <LoadingDots className="text-white py-2" />
          ) : (
            "Sign In "
          )}
        </button>
      </div>
    </motion.div>
  );
};
