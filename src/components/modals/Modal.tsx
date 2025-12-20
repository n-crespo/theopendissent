import React from "react";

interface ModalProps {
  id: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal = ({ id, onClose, children }: ModalProps) => {
  return (
    <div id={id} className="modal-overlay visible">
      <div className="modal-card">
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
