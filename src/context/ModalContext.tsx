import { createContext, useContext, useState, ReactNode } from "react";

type ModalType = "signin" | "help" | "logout" | "postDetails" | null;

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

  const openModal = (type: ModalType, payload: any = null) => {
    setModalPayload(payload);
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalPayload(null);
  };

  return (
    <ModalContext.Provider
      value={{ activeModal, modalPayload, openModal, closeModal }}
    >
      {children}
    </ModalContext.Provider>
  );
};

/**
 * Controls the visibility of global app modals.
 */
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal must be used within ModalProvider");
  return context;
};
