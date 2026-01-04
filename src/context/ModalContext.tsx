import { createContext, useContext, useState, ReactNode } from "react";

type ModalType =
  | "signin"
  | "about" // renamed from help
  | "installInstructions"
  | "logout"
  | "postDetails"
  | "deleteConfirm"
  | "confirmPost"
  | "listen"
  | null;

interface ModalInstance {
  type: ModalType;
  payload: any;
}

interface ModalContextType {
  modalStack: ModalInstance[];
  activeModal: ModalType;
  modalPayload: any;
  openModal: (type: ModalType, payload?: any) => void;
  closeModal: () => void;
  closeAllModals: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalStack, setModalStack] = useState<ModalInstance[]>([]);

  /**
   * Pushes a new modal onto the stack
   */
  const openModal = (type: ModalType, payload: any = null) => {
    if (!type) return;
    setModalStack((prev) => [...prev, { type, payload }]);
  };

  /**
   * Pops the top-most modal from the stack
   */
  const closeModal = () => {
    setModalStack((prev) => prev.slice(0, -1));
  };

  /**
   * Clears the entire stack
   */
  const closeAllModals = () => {
    setModalStack([]);
  };

  // derived values for backward compatibility with single-modal logic
  const topInstance = modalStack[modalStack.length - 1];
  const activeModal = topInstance?.type || null;
  const modalPayload = topInstance?.payload || null;

  return (
    <div className="contents">
      <ModalContext.Provider
        value={{
          modalStack,
          activeModal,
          modalPayload,
          openModal,
          closeModal,
          closeAllModals,
        }}
      >
        {children}
      </ModalContext.Provider>
    </div>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal must be used within ModalProvider");
  return context;
};
