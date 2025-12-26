import React from "react";

interface ConfirmDeleteModalProps {
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}

/**
 * matches the logout modal styling for permanent deletion actions.
 */
export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  onClose,
  onConfirm,
  itemName,
}) => {
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4 text-[#1a1a1a]">Delete Post?</h2>

      <div className="w-full bg-slate-50 rounded-lg p-4 mb-6 flex flex-col items-center border border-slate-100">
        <div className="font-semibold text-logo-red text-center line-clamp-2">
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
