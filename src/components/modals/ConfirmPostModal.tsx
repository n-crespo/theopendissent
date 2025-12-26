interface ConfirmPostModalProps {
  onConfirm: () => void;
  onClose: () => void;
  content: string;
}

/**
 * matches the global modal styling with a preview of the user's input.
 */
export const ConfirmPostModal = ({
  onConfirm,
  onClose,
  content,
}: ConfirmPostModalProps) => {
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4 text-[#1a1a1a]">Ready to post?</h2>

      {/* content preview box */}
      <div className="w-full bg-slate-50 rounded-lg p-4 mb-6 flex flex-col border border-slate-100 max-h-48 overflow-y-auto custom-scrollbar">
        <div className="text-[10px] font-bold text-logo-blue uppercase tracking-widest mb-2 opacity-70">
          Preview
        </div>
        <div className="text-sm text-[#333] leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </div>
      </div>

      <p className="text-sm text-gray-custom text-center mb-6 leading-relaxed">
        Double check for typos! You can still edit or delete this later if
        needed.
      </p>

      <div className="w-full flex flex-col items-center">
        {/* main action: confirm */}
        <button
          className="inline-flex w-full items-center justify-center rounded-lg bg-logo-blue p-3 text-base font-semibold text-white cursor-pointer border-none transition-all duration-200 hover:opacity-90 hover:shadow-[0_4px_12px_rgba(66,133,244,0.2)]"
          onClick={onConfirm}
        >
          Confirm & Post
        </button>

        {/* secondary action: cancel */}
        <button
          className="w-full mt-3.75 p-2 bg-none border-none text-sm text-gray-custom cursor-pointer transition-all hover:text-[#222222] hover:underline"
          onClick={onClose}
        >
          Wait, let me edit
        </button>
      </div>
    </div>
  );
};
