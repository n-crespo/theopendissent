import helpIcon from "../../assets/icons/help.svg";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";

/**
 * sign-in content for the global modal container.
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
    <div className="modal-content" id="sign-in-view">
      <h2>Sign In</h2>
      <div className="sign-in-description">
        <p style={{ textAlign: "center" }}>
          Sign in with a <strong>@g.ucla.edu</strong> email to post or interact!
        </p>
        <p style={{ textAlign: "center" }}>
          Unsure? Tap the
          <img src={helpIcon} className="help-inline-icon" alt="Help" />
          in the top left to learn more.
        </p>
      </div>

      <div className="modal-actions">
        <button className="btn btn-google" onClick={handleSignIn}>
          <i className="bi bi-google"></i>
          <span>Sign In with Google</span>
        </button>

        <button
          id="close-sign-in-btn"
          className="btn-link"
          onClick={closeModal}
        >
          I'm just lurking
        </button>
      </div>
    </div>
  );
};
