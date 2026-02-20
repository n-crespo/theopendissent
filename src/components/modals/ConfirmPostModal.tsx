interface ConfirmPostModalProps {
  onConfirm: () => void;
  onClose: () => void;
  content: string;
}

/**
 * matches the refined global modal styling.
 * uses css variables for radius and border tokens.
 */
export const ConfirmPostModal = ({
  onConfirm,
  onClose,
  content,
}: ConfirmPostModalProps) => {
  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-semibold mb-6 text-slate-900 text-center">
        Review your post
      </h2>

      {/* content preview box: using global border and background tokens */}
      <div className="w-full bg-bg-preview rounded-xl p-4 mb-6 flex flex-col border border-border-subtle max-h-48 overflow-y-auto custom-scrollbar">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Preview
        </div>
        <div className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap wrap-break-word">
          {content}
        </div>
      </div>

      <p className="text-sm text-slate-500 text-center mb-8 px-2">
        Double check for typos. You can edit or delete this post later if
        needed.
      </p>

      <div className="w-full flex flex-col gap-2">
        {/* primary action: post now */}
        <button
          className="inline-flex w-full items-center justify-center rounded-xl bg-logo-blue px-4 py-2.5 text-sm font-semibold text-white cursor-pointer transition-colors hover:bg-logo-blue/90"
          onClick={onConfirm}
        >
          Post now
        </button>

        {/* secondary action: ghost style */}
        <button
          className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
          onClick={onClose}
        >
          Wait, let me edit
        </button>
      </div>
    </div>
  );
};
