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
          className="fixed inset-0 flex items-center justify-center bg-black/40 p-4 transition-opacity duration-300"
          style={{ zIndex: 1000 + index }}
          onClick={closeModal}
        >
          <div
            className="relative flex max-h-[85vh] w-full max-w-112.5 flex-col bg-white transition-all animate-in fade-in zoom-in-[0.98] duration-200"
            style={{
              borderRadius: "var(--radius-modal)",
              border: "1px solid var(--color-border-subtle)",
              boxShadow: "var(--shadow-modal)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* close button: ghost style, slightly rounded */}
            <button
              className="absolute top-3 right-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 active:bg-slate-200"
              onClick={closeModal}
              aria-label="Close"
            >
              <i className="bi bi-x-lg text-lg"></i>
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
