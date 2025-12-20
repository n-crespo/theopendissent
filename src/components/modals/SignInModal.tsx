// src/components/modals/SignInModal.tsx
import { Modal } from "./Modal";
import helpIcon from "../../assets/icons/help.svg";

interface SignInProps {
  onClose: () => void;
  onSignIn: () => void;
}

export const SignInModal = ({ onClose, onSignIn }: SignInProps) => {
  return (
    <Modal id="sign-in-view" onClose={onClose}>
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
      <button className="btn btn-google" onClick={onSignIn}>
        <i className="bi bi-google"></i>
        <span>Sign In with Google</span>
      </button>
      <button id="close-sign-in-btn" onClick={onClose}>
        I'm just lurking
      </button>
    </Modal>
  );
};
