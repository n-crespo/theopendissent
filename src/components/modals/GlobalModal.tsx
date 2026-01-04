import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../../context/ModalContext";
import { SignInModal } from "./SignInModal";
import { AboutModal } from "./AboutModal";
import { InstallInstructionsModal } from "./InstallInstructionsModal";
import { LogoutModal } from "./LogoutModal";
import { PostDetailsView } from "./PostDetailsView";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { ConfirmPostModal } from "./ConfirmPostModal";
import { ListenModal } from "./ListenModal";
import { useEffect } from "react";

/**
 * Manages the visibility and content of the application's central modal system.
 * Uses Framer Motion for entry/exit and automatic layout resizing.
 */
export const GlobalModal = () => {
  const { modalStack, closeModal } = useModal();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalStack.length > 0) {
        // Prevent generic browser stop actions if necessary
        e.preventDefault();
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalStack, closeModal]);

  // if (modalStack.length === 0) return null;

  return (
    <AnimatePresence>
      {modalStack.map((modal, index) => (
        <motion.div
          key={`${modal.type}-${index}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex items-center justify-center bg-black/40 p-2"
          style={{ zIndex: 1000 + index }}
          onClick={closeModal}
        >
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{
              type: "tween",
              damping: 22,
              stiffness: 250,
              layout: { duration: 0.35 }, // Controls the resize speed
            }}
            className="relative flex min-h-[23vh] max-h-[83vh] w-full max-w-120 flex-col overflow-hidden bg-white shadow-(--shadow-modal)"
            style={{
              borderRadius: "var(--radius-modal)",
              border: "1px solid var(--color-border-subtle)",
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
              {modal.type === "about" && <AboutModal />}
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
              {modal.type === "listen" && <ListenModal />}
            </div>
          </motion.div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};
