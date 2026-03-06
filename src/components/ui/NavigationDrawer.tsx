import { useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  side?: "left" | "right";
}

export const NavigationDrawer = ({
  isOpen,
  onClose,
  children,
  side = "right",
}: NavigationDrawerProps) => {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle escape key for accessibility
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const sideVariants = {
    left: { x: "-100%" },
    right: { x: "100%" },
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop: Clicking this triggers onClose */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-100 bg-slate-900/10 cursor-pointer"
          />

          {/* Drawer: Width constrained to ensure it never covers the full screen */}
          <motion.div
            initial={sideVariants[side]}
            animate={{ x: 0 }}
            exit={sideVariants[side]}
            transition={{ type: "spring", damping: 25, stiffness: 240 }}
            className={`fixed top-0 bottom-0 z-101 w-72 bg-white/95 backdrop-blur-md shadow-2xl flex flex-col
              ${side === "right" ? "right-0 border-l border-slate-200" : "left-0 border-r border-slate-200"}
            `}
          >
            {/* Scrollable Content: pt-8 replaces the header for top spacing */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1 pt-2">
              <div className="flex flex-col gap-1">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};

// --- Sub-components for semantic consistency ---

export const DrawerItem = ({
  icon,
  label,
  onClick,
  variant = "default",
}: {
  icon?: string;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-4 px-4 py-3 rounded-2xl text-left text-base font-semibold transition-all active:scale-[0.98] hover:scale-[0.98]
      ${variant === "danger" ? "text-logo-red" : "text-slate-800"}`}
  >
    {icon && (
      <div
        className={`h-8 rounded-xl flex items-center justify-center
        ${variant === "danger" ? "text-logo-red" : "text-slate-800"}`}
      >
        <i className={`bi ${icon} text-xl`}></i>
      </div>
    )}
    {label}
  </button>
);
