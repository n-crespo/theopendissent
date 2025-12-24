import { useModal } from "../../context/ModalContext";
import { SignInModal } from "./SignInModal";
import { HelpModal } from "./HelpModal";
import { LogoutModal } from "./LogoutModal";
import { PostDetailsView } from "../PostDetailsView";

export const GlobalModal = () => {
  const { activeModal, modalPayload, closeModal } = useModal();

  if (!activeModal) return null;

  return (
    /* overlay: fixed position, covers screen, semi-transparent black, 
       centered content using flex 
    */
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={closeModal}
    >
      {/* card: white bg, shadow, relative for the close button, 
         prevents click-through to overlay 
      */}
      <div
        className="relative w-full max-w-[450px] rounded-2xl bg-white p-8 shadow-2xl transition-transform duration-300 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* close button: positioned in top-right corner */}
        <button
          className="absolute top-3 right-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
          onClick={closeModal}
          aria-label="Close"
        >
          <i className="bi bi-x-lg text-sm"></i>
        </button>

        <div className="text-left">
          {activeModal === "signin" && <SignInModal />}
          {activeModal === "help" && <HelpModal />}
          {activeModal === "logout" && <LogoutModal />}
          {activeModal === "postDetails" && (
            <PostDetailsView post={modalPayload} />
          )}
        </div>
      </div>
    </div>
  );
};
