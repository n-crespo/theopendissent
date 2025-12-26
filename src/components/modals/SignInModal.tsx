import helpIcon from "../../assets/icons/help.svg";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";

/**
 * Sign-in content for the global modal container.
 * updated with professional geometry and token-based styling.
 */
export const SignInModal = () => {
  const { signIn } = useAuth();
  const { closeModal } = useModal();

  const handleSignIn = async () => {
    try {
      await signIn();
      closeModal();
    } catch (error) {
      console.error("failed to sign in:", error);
    }
  };

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-semibold mb-6 text-slate-900 text-center">
        Sign in
      </h2>

      <div className="mb-8 space-y-4 px-2">
        <p className="text-center text-slate-700 leading-relaxed">
          Sign in with a{" "}
          <strong className="font-bold text-logo-blue">@g.ucla.edu</strong>{" "}
          email to post or interact!
        </p>
        <p className="text-center text-sm text-slate-500 leading-relaxed">
          Unsure? Tap the{" "}
          <img
            src={helpIcon}
            className="inline-block h-4 w-4 align-text-bottom mx-0.5 opacity-70"
            alt="Help"
            draggable="false"
          />{" "}
          icon in the top left to learn more.
        </p>
      </div>

      <div className="w-full flex flex-col gap-2">
        {/* primary google button: uses global radius-button token */}
        <button
          className="inline-flex w-full items-center justify-center gap-3 rounded-[var(--radius-button)] bg-[#4285f4] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#357ae8] cursor-pointer border-none shadow-sm"
          onClick={handleSignIn}
        >
          <i className="bi bi-google text-base"></i>
          <span>Sign in with Google</span>
        </button>

        {/* ghost-style secondary button */}
        <button
          className="w-full rounded-[var(--radius-button)] px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100"
          onClick={closeModal}
        >
          I'm just lurking
        </button>
      </div>
    </div>
  );
};
