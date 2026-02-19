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
      closeModal();
    } catch (err: any) {
      console.error("Sign in failed:", err);

      // Check for the specific blocking function error code
      if (err.code === "auth/internal-error" || err.message?.includes("ucla")) {
        setError("Sorry, only @g.ucla.edu emails are allowed right now.");
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
          Sign in with a{" "}
          <strong className="font-bold text-logo-blue">@g.ucla.edu</strong>{" "}
          email to post or interact!
        </p>

        {/* Inline Error Message */}
        {error && (
          <p className="text-center text-sm text-(--disagree) leading-relaxed animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}

        {!error && (
          <p className="text-center text-sm text-slate-500 leading-relaxed">
            Unsure? Tap
            <span className="text-[15px] font-bold whitespace-nowrap px-2 rounded-full border mx-1 bg-logo-offwhite border-slate-200 shadow-sm">
              ?
            </span>
            in the top left to learn more.
          </p>
        )}
      </div>

      <div className="w-full flex flex-col gap-2">
        <button
          className="inline-flex w-full items-center justify-center gap-3 rounded-(--radius-button) bg-[#4285f4] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#357ae8] cursor-pointer border-none shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
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
              <i className="bi bi-google text-base"></i>
              <span>Sign in with Google</span>
            </>
          )}
        </button>

        <button
          className="w-full rounded-(--radius-button) px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100"
          onClick={closeModal}
          disabled={isSigningIn}
        >
          I'm just lurking
        </button>
      </div>
    </div>
  );
};
