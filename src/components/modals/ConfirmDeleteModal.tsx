import React from "react";

interface ConfirmDeleteModalProps {
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}

/**
 * matches the confirm post modal styling with a preview of the content being deleted.
 */
export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  onClose,
  onConfirm,
  itemName,
}) => {
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4 text-[#1a1a1a]">Delete Post?</h2>

      {/* content preview box - identical to confirm post styling */}
      <div className="w-full bg-slate-50 rounded-lg p-4 mb-6 flex flex-col border border-slate-100 max-h-48 overflow-y-auto custom-scrollbar">
        <div className="text-[10px] font-bold text-logo-red uppercase tracking-widest mb-2 opacity-70 text-left">
          Content
        </div>
        <div className="text-sm text-[#333] leading-relaxed whitespace-pre-wrap wrap-break-word text-left">
          {itemName || "this item"}
        </div>
      </div>

      <p className="text-sm text-gray-custom text-center mb-6 leading-relaxed">
        This action is permanent and cannot be reversed.
      </p>

      <div className="w-full flex flex-col items-center">
        {/* main destructive action */}
        <button
          className="inline-flex w-full items-center justify-center rounded-lg bg-logo-red p-3 text-base font-semibold text-white cursor-pointer border-none transition-all duration-200 hover:opacity-90 hover:shadow-[0_4px_12px_rgba(112,22,30,0.2)]"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          Delete Permanently
        </button>

        {/* secondary cancel action */}
        <button
          className="w-full mt-3.75 p-2 bg-none border-none text-sm text-gray-custom cursor-pointer transition-all hover:text-[#222222] hover:underline"
          onClick={onClose}
        >
          Nevermind, go back
        </button>
      </div>
    </div>
  );
};
