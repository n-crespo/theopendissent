import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import { LoadingDots } from "../ui/LoadingDots";

export const SignInModal = () => {
  const { signIn } = useAuth();
  const { closeModal } = useModal();

  // Local state for UI feedback
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setError(null); // Clear previous errors

    try {
      await signIn();
      sessionStorage.setItem("justLoggedIn", "true");
      closeModal();
    } catch (err: any) {
      console.error("Sign in failed:", err);

      // Check for the specific blocking function error code
      if (err.code === "auth/internal-error" || err.message?.includes("ucla")) {
        setError("Sorry, only UCLA emails are allowed right now.");
      } else {
        setError("Sign in failed. Please try again.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-semibold mb-6 text-slate-900 text-center">
        Sign In
      </h2>

      <div className="mb-8 space-y-4 px-2">
        <p className="text-center text-slate-700 leading-relaxed">
          GREAT NEWS: you already have an account!
          <p className="italic">(just sign in with your UCLA email)</p>
        </p>

        {/* Inline Error Message */}
        {error && (
          <p className="text-center text-sm text-(--disagree) leading-relaxed animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>

      <div className="w-full flex flex-col gap-2">
        <button
          className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-linear-to-r from-logo-red via-logo-green to-logo-blue animate-shimmer bg-size-[200%_auto] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#357ae8] cursor-pointer border-none shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          onClick={handleSignIn}
          disabled={isSigningIn} // Disable while loading
        >
          {isSigningIn ? (
            <div className="flex items-center gap-2">
              <LoadingDots className="text-white" />
              <span>Verifying...</span>
            </div>
          ) : (
            <>
              {/* <i className="bi bi-google text-base"></i> */}
              <span>Sign In</span>
            </>
          )}
        </button>

        <button
          className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100"
          onClick={closeModal}
          disabled={isSigningIn}
        >
          I'm just lurking and too nonchalant for politics (no you're not)
        </button>
      </div>
    </div>
  );
};
