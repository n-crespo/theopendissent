import { useModal } from "../../context/ModalContext";
import { SignInModal } from "./SignInModal";
import { HelpModal } from "./HelpModal";
import { LogoutModal } from "./LogoutModal";
import { PostDetailsView } from "../PostDetailsView";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { ConfirmPostModal } from "./ConfirmPostModal";

/**
 * manages the visibility and content of the application's central modal system.
 */
export const GlobalModal = () => {
  const { activeModal, modalPayload, closeModal } = useModal();

  if (!activeModal) return null;

  return (
    <div
      className="fixed inset-0 z-1000 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={closeModal}
    >
      <div
        // only allow modals to take 80% of the view height
        className="relative flex max-h-[80vh] w-full max-w-112.5 flex-col rounded-2xl bg-white shadow-2xl transition-transform duration-300 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* close button: fixed in the corner of the modal card */}
        <button
          className="absolute top-3 right-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
          onClick={closeModal}
          aria-label="Close"
        >
          <i className="bi bi-x-lg text-sm"></i>
        </button>

        {/* content area: scrollable if the child content exceeds max-h */}
        <div className="custom-scrollbar overflow-y-auto p-8 text-left">
          {activeModal === "signin" && <SignInModal />}
          {activeModal === "help" && <HelpModal />}
          {activeModal === "logout" && <LogoutModal />}
          {activeModal === "postDetails" && (
            <PostDetailsView post={modalPayload} />
          )}
          {/* render delete confirmation */}
          {activeModal === "deleteConfirm" && (
            <ConfirmDeleteModal
              itemName={modalPayload?.name || "this item"}
              onConfirm={modalPayload?.onConfirm}
              onClose={closeModal}
            />
          )}
          {activeModal === "confirmPost" && (
            <ConfirmPostModal
              content={modalPayload?.content}
              onConfirm={modalPayload?.onConfirm}
              onClose={closeModal}
            />
          )}
        </div>
      </div>
    </div>
  );
};
