import React from "react";

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * a generic shell for all modals in the app.
 */
export const Modal = ({ onClose, children }: ModalProps) => {
  return (
    <div className="modal-overlay visible" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          className="close-modal-btn"
          aria-label="Close"
          onClick={onClose}
        >
          <i className="bi bi-x-lg"></i>
        </button>
        {children}
      </div>
    </div>
  );
};
