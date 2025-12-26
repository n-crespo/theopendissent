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
          className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          style={{ zIndex: 1000 + index }}
          onClick={closeModal}
        >
          <div
            className="relative flex max-h-[85vh] w-full max-w-112.5 flex-col rounded-xl border border-slate-200 bg-white shadow-xl transition-all animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* close button: ghost style, slightly rounded */}
            <button
              className="absolute top-4 right-4 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              onClick={closeModal}
              aria-label="Close"
            >
              <i className="bi bi-x-lg text-base"></i>
            </button>

            {/* content area */}
            <div className="custom-scrollbar overflow-y-auto p-10 text-left">
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
