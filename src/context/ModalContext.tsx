import { createContext, useContext, useState, ReactNode } from "react";

/**
 * updated to include "deleteConfirm"
 */
type ModalType =
  | "signin"
  | "help"
  | "logout"
  | "postDetails"
  | "deleteConfirm"
  | "confirmPost"
  | null;

interface ModalContextType {
  activeModal: ModalType;
  modalPayload: any; // holds the post data
  openModal: (type: ModalType, payload?: any) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalPayload, setModalPayload] = useState<any>(null);

  /**
   * sets the active modal type and optional data payload
   */
  const openModal = (type: ModalType, payload: any = null) => {
    setModalPayload(payload);
    setActiveModal(type);
  };

  /**
   * resets the modal state to null
   */
  const closeModal = () => {
    setActiveModal(null);
    setModalPayload(null);
  };

  return (
    <div className="contents">
      <ModalContext.Provider
        value={{ activeModal, modalPayload, openModal, closeModal }}
      >
        {children}
      </ModalContext.Provider>
    </div>
  );
};

/**
 * controls the visibility of global app modals.
 */
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal must be used within ModalProvider");
  return context;
};
