interface ConfirmDeleteModalProps {
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}

/**
 * matches the refined global modal styling.
 * uses danger branding with geometric, professional components.
 */
export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  onClose,
  onConfirm,
  itemName,
}) => {
  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-semibold mb-6 text-slate-900 text-center">
        Delete this post?
      </h2>

      {/* content preview box: aligned with confirm post styling */}
      <div className="w-full bg-slate-50/50 rounded-md p-4 mb-6 flex flex-col border border-slate-200 max-h-48 overflow-y-auto custom-scrollbar">
        <div className="text-[11px] font-bold text-logo-red uppercase tracking-wider mb-2 opacity-80">
          Content to remove
        </div>
        <div className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
          {itemName || "this item"}
        </div>
      </div>

      <p className="text-sm text-slate-500 text-center mb-8 px-4 leading-relaxed">
        This action is permanent and cannot be undone.
      </p>

      <div className="w-full flex flex-col gap-2">
        {/* primary action: destructive red */}
        <button
          className="inline-flex w-full items-center justify-center rounded-md bg-logo-red px-4 py-2.5 text-sm font-semibold text-white cursor-pointer transition-colors hover:bg-red-700"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          Delete permanently
        </button>

        {/* secondary action: ghost style */}
        <button
          className="w-full rounded-md px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
          onClick={onClose}
        >
          Nevermind, keep it
        </button>
      </div>
    </div>
  );
};
