import { ConfirmActionModal } from "./ConfirmActionModal";

interface ConfirmDeleteModalProps {
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}

export const ConfirmDeleteModal = ({
  itemName,
  onConfirm,
  onClose,
}: ConfirmDeleteModalProps) => {
  return (
    <ConfirmActionModal
      title="Delete this post?"
      content={itemName || "this item"}
      description="This action is permanent and cannot be undone."
      confirmText="Delete permanently"
      cancelText="Nevermind, keep it"
      variant="danger"
      onClose={onClose}
      onConfirm={() => {
        onConfirm();
        onClose();
      }}
    />
  );
};
