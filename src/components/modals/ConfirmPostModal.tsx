interface ConfirmPostModalProps {
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmPostModal = ({
  onConfirm,
  onClose,
}: ConfirmPostModalProps) => {
  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-2xl font-bold mb-4 text-[#1a1a1a]">Ready to post?</h2>

      <p className="text-slate-600 mb-8 leading-relaxed">
        Ready to publish your post? You can always edit or delete it later.
      </p>

      <div className="w-full flex flex-col gap-3">
        {/* confirm button */}
        <button
          className="w-full rounded-lg bg-logo-blue p-3 text-base font-semibold text-white transition-colors hover:bg-logo-blue/90 cursor-pointer shadow-sm"
          onClick={onConfirm}
        >
          Confirm & Post
        </button>

        {/* cancel/edit button */}
        <button
          className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-3 text-base font-semibold text-slate-600 transition-all hover:bg-slate-50"
          onClick={onClose}
        >
          Keep Editing
        </button>
      </div>
    </div>
  );
};
