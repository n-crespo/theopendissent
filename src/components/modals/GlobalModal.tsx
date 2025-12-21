import { useModal } from "../../context/ModalContext";
import { SignInModal } from "./SignInModal";
import { HelpModal } from "./HelpModal";
import { LogoutModal } from "./LogoutModal";
import { PostDetailsView } from "../PostDetailsView";

export const GlobalModal = () => {
  const { activeModal, modalPayload, closeModal } = useModal();

  if (!activeModal) return null;

  return (
    <div className="modal-overlay visible" onClick={closeModal}>
      {/* stopPropagation prevents the modal from closing when clicking the card itself */}
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          className="close-modal-btn"
          onClick={closeModal}
          aria-label="Close"
        >
          <i className="bi bi-x-lg"></i>
        </button>

        {activeModal === "signin" && <SignInModal />}
        {activeModal === "help" && <HelpModal />}
        {activeModal === "logout" && <LogoutModal />}
        {activeModal === "postDetails" && (
          <PostDetailsView post={modalPayload} />
        )}
      </div>
    </div>
  );
};
