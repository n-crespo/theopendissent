interface ConfirmDeleteModalProps {
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}

/**
 * simple inner content for the global modal when confirming deletion.
 */
const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  onClose,
  onConfirm,
  itemName,
}) => {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
      <p className="mt-4 text-gray-600">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-gray-800">{itemName}</span>? This
        action is permanent and cannot be reversed.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        {/* executes delete logic */}
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
        >
          Delete Permanently
        </button>

        {/* closes modal without action */}
        <button
          onClick={onClose}
          className="w-full rounded-xl py-3 text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
        >
          Nevermind, go back
        </button>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
