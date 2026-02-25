import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../../context/ModalContext";
import { SignInModal } from "./SignInModal";
import { AboutModal } from "./AboutModal";
import { InstallPwaModal } from "./InstallPwaModal";
import { SignOutModal } from "./SignOutModal";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { ConfirmPostModal } from "./ConfirmPostModal";
import { ListenModal } from "./ListenModal";
import { useEffect } from "react";
import { JoinTeamModal } from "./JoinTeamModal";
import { FollowUsModal } from "./FollowUsModal";

/**
 * Manages the visibility and content of the application's central modal system.
 * Uses Framer Motion for entry/exit and automatic layout resizing.
 */
export const GlobalModal = () => {
  const { modalStack, closeModal } = useModal();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalStack.length > 0) {
        e.preventDefault();
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalStack, closeModal]);

  return (
    <AnimatePresence>
      {modalStack.map((modal, index) => {
        return (
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
                layout: { duration: 0.35 },
              }}
              className={`
                relative flex w-full max-w-120 flex-col overflow-hidden bg-white shadow-(--shadow-modal)
                "min-h-[23vh] max-h-[83vh]"
              `}
              style={{
                borderRadius: "var(--radius-modal)",
                border: "1px solid var(--color-border-subtle)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-50 flex h-10 w-full shrink-0 items-center justify-end bg-white/80 backdrop-blur-sm px-1">
                <button
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg text-lg"></i>
                </button>
              </div>

              {/* Content Area */}
              {/* 'flex-1' and 'h-full' so the internal scrollbar area fills the fixed height */}
              <div
                className={`
                  custom-scrollbar overflow-y-auto p-4 pt-0 text-left}
                `}
              >
                {modal.type === "signin" && <SignInModal />}
                {modal.type === "about" && <AboutModal />}
                {modal.type === "installPwa" && <InstallPwaModal />}
                {modal.type === "signOut" && <SignOutModal />}
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
                {modal.type === "joinTeam" && <JoinTeamModal />}
                {modal.type === "followUs" && <FollowUsModal />}
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
};
