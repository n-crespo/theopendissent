interface ConfirmActionModalProps {
  title: string;
  description: string;
  content: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onClose: () => void;
  variant?: "primary" | "danger";
}

export const ConfirmActionModal = ({
  title,
  description,
  content,
  confirmText,
  cancelText,
  onConfirm,
  onClose,
  variant = "primary",
}: ConfirmActionModalProps) => {
  const isDanger = variant === "danger";

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-bold mb-6 text-slate-900 text-center">
        {title}
      </h2>

      {/* preview area matching feeditem body geometry */}
      <div className="w-full bg-slate-50/50 rounded-2xl p-5 mb-6 flex flex-col border border-slate-200 max-h-48 overflow-y-auto custom-scrollbar">
        <div className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </div>
      </div>

      <p className="text-sm text-slate-500 text-center mb-8 px-4 leading-relaxed">
        {description}
      </p>

      <div className="w-full flex flex-col gap-2">
        <button
          className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold text-white cursor-pointer transition-all active:scale-95 ${
            isDanger
              ? "bg-logo-red hover:brightness-110 shadow-lg shadow-red-100"
              : "bg-logo-blue hover:brightness-110 shadow-lg shadow-blue-100"
          }`}
          onClick={onConfirm}
        >
          {confirmText}
        </button>

        <button
          className="w-full rounded-xl px-4 py-3 text-sm font-bold text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          onClick={onClose}
        >
          {cancelText}
        </button>
      </div>
    </div>
  );
};
