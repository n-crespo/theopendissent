import { ConfirmActionModal } from "./ConfirmActionModal";

interface ConfirmPostModalProps {
  onConfirm: () => void;
  onClose: () => void;
  content: string;
}

export const ConfirmPostModal = (props: ConfirmPostModalProps) => {
  return (
    <ConfirmActionModal
      {...props}
      variant="primary"
      title="Review your post"
      description="Double check for typos. You can edit or delete this post later if needed."
      confirmText="Post now"
      cancelText="Wait, let me edit"
    />
  );
};
