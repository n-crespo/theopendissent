import { Modal } from "./Modal";
import helpIcon from "../../assets/icons/help.svg";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";

export const SignInModal = () => {
  const { signIn } = useAuth();
  const { closeModal } = useModal();

  /**
   * handles the sign in process and closes the modal on success
   */
  const handleSignIn = async () => {
    await signIn();
    closeModal();
  };

  return (
    <Modal id="sign-in-view" onClose={closeModal}>
      <h2>Sign In</h2>
      <div className="modal-content">
        <p style={{ textAlign: "center" }}>
          Sign in with a <strong>@g.ucla.edu</strong> email to post or interact!
        </p>
        <p style={{ textAlign: "center" }}>
          Unsure? Tap the
          <img
            src={helpIcon}
            style={{
              maxWidth: "17px",
              marginBottom: "-3px",
              marginLeft: "3px",
              marginRight: "3px",
            }}
            alt="Help"
          />
          in the top left to learn more.
        </p>
      </div>
      <button className="btn btn-google" onClick={handleSignIn}>
        <i className="bi bi-google"></i>
        <span>Sign In with Google</span>
      </button>
      <button id="close-sign-in-btn" onClick={closeModal}>
        I'm just lurking
      </button>
    </Modal>
  );
};
