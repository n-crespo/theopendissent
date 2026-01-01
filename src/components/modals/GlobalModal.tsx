import { useModal } from "../../context/ModalContext";
import { SignInModal } from "./SignInModal";
import { AboutModal } from "./AboutModal";
import { InstallInstructionsModal } from "./InstallInstructionsModal";
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
          className="fixed inset-0 flex items-center justify-center bg-black/40 p-2 transition-opacity duration-300"
          style={{ zIndex: 1000 + index }}
          onClick={closeModal}
        >
          <div
            className="relative flex min-h-[83vh] max-h-[83vh] w-full max-w-120 flex-col overflow-hidden bg-white transition-all animate-in fade-in zoom-in-[0.98] duration-200"
            style={{
              borderRadius: "var(--radius-modal)",
              border: "1px solid var(--color-border-subtle)",
              boxShadow: "var(--shadow-modal)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* small fixed header */}
            <div className="sticky top-0 z-50 flex h-10 w-full shrink-0 items-center justify-end bg-white/80 backdrop-blur-sm px-1">
              <button
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
                onClick={closeModal}
                aria-label="Close"
              >
                <i className="bi bi-x-lg text-lg"></i>
              </button>
            </div>

            {/* content area */}
            <div className="custom-scrollbar overflow-y-auto p-5 pt-0 text-left">
              {modal.type === "signin" && <SignInModal />}
              {/* Updated from help to about */}
              {modal.type === "about" && <AboutModal />}
              {/* New modal type */}
              {modal.type === "installInstructions" && (
                <InstallInstructionsModal />
              )}
              {modal.type === "logout" && <LogoutModal />}
              {modal.type === "postDetails" && (
                <PostDetailsView
                  post={modal.payload.post || modal.payload}
                  highlightReplyId={modal.payload.highlightReplyId}
                />
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
