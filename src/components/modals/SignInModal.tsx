import helpIcon from "../../assets/icons/help.svg";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";

/**
 * sign-in content for the global modal container.
 * uses logo- prefix and specific pixel values to match previous CSS.
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
    <div className="flex flex-col items-center text-[#333]">
      <h2 className="text-2xl font-bold mb-4 text-[#1a1a1a]">Sign In</h2>

      <div className="mb-8 space-y-4">
        <p className="text-center leading-relaxed">
          Sign in with a{" "}
          <strong className="font-bold text-logo-blue">@g.ucla.edu</strong>{" "}
          email to post or interact!
        </p>
        <p className="text-center flex items-center justify-center gap-1 leading-relaxed">
          Unsure? Tap the
          <img
            src={helpIcon}
            className="h-5 w-5 mx-0.5"
            alt="Help"
            draggable="false"
          />
          in the top left to learn more.
        </p>
      </div>

      <div className="w-full flex flex-col items-center gap-3">
        {/* primary google button */}
        <button
          className="inline-flex w-full items-center justify-center gap-3 rounded-lg bg-[#4285f4] p-3 text-base font-semibold text-white transition-colors duration-200 hover:bg-[#357ae8] cursor-pointer border-none shadow-sm"
          onClick={handleSignIn}
        >
          <i className="bi bi-google text-lg"></i>
          <span>Sign In with Google</span>
        </button>

        {/* maybe later button */}
        <button
          className="mt-2.5 cursor-pointer border-none bg-none p-2 text-sm text-[#6c757d] transition-all hover:underline"
          onClick={closeModal}
        >
          I'm just lurking
        </button>
      </div>
    </div>
  );
};
