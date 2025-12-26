import { useModal } from "../../context/ModalContext";
import { SignInModal } from "./SignInModal";
import { HelpModal } from "./HelpModal";
import { LogoutModal } from "./LogoutModal";
import { PostDetailsView } from "../PostDetailsView";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { ConfirmPostModal } from "./ConfirmPostModal";

/**
 * Manages the visibility and content of the application's central modal system.
 * supports stacked modals by mapping over the modalStack.
 */
export const GlobalModal = () => {
  const { modalStack, closeModal } = useModal();

  if (modalStack.length === 0) return null;

  return (
    <>
      {modalStack.map((modal, index) => (
        <div
          key={`${modal.type}-${index}`}
          className="fixed inset-0 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          // increment z-index so top modals stay above lower ones
          style={{ zIndex: 1000 + index }}
          onClick={closeModal}
        >
          <div
            className="relative flex max-h-[80vh] w-full max-w-112.5 flex-col rounded-2xl bg-white shadow-2xl transition-transform duration-300 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* close button */}
            <button
              className="absolute top-3 right-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
              onClick={closeModal}
              aria-label="Close"
            >
              <i className="bi bi-x-lg text-sm"></i>
            </button>

            {/* content area */}
            <div className="custom-scrollbar overflow-y-auto p-8 text-left">
              {modal.type === "signin" && <SignInModal />}
              {modal.type === "help" && <HelpModal />}
              {modal.type === "logout" && <LogoutModal />}
              {modal.type === "postDetails" && (
                <PostDetailsView post={modal.payload} />
              )}
              {modal.type === "deleteConfirm" && (
                <ConfirmDeleteModal
                  itemName={modal.payload?.name || "this item"}
                  onConfirm={modal.payload?.onConfirm}
                  onClose={closeModal}
                />
              )}
              {modal.type === "confirmPost" && (
                <ConfirmPostModal
                  content={modal.payload?.content}
                  onConfirm={modal.payload?.onConfirm}
                  onClose={closeModal}
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
