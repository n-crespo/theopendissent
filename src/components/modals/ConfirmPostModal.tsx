import { Badge } from "../ui/Badge";

interface ConfirmPostModalProps {
  onConfirm: () => void;
  onClose: () => void;
  content: string;
  authorDisplay?: string;
  isThreadAuthor?: boolean;
}

export const ConfirmPostModal = ({
  onConfirm,
  onClose,
  content,
  authorDisplay = "Anonymous User",
  isThreadAuthor = false,
}: ConfirmPostModalProps) => {
  return (
    <div
      className="p-[clamp(1.25rem,4vw,1.5rem)] flex flex-col items-center bg-white"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-xl font-semibold text-stone-900 tracking-tight text-center mb-3 leading-snug">
        Review your post
      </h3>

      {/* preview area matching feeditem body geometry */}
      <div className="w-full bg-white rounded-card p-4 mb-6 flex flex-col border border-stone-200 shadow-sm">
        {/* Mock FeedItem Header */}
        <div className="flex items-center gap-x-3 mb-3">
          <div className="h-10 w-10 bg-stone-100 rounded-control flex items-center justify-center text-stone-500 shrink-0 border border-stone-200/50">
            <i className="bi bi-person-fill text-lg"></i>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-stone-900 leading-tight flex items-center gap-x-1.5">
              <Badge label="You" variant="blue" />
              {isThreadAuthor && <Badge label="Author" variant="green" />}
              <span>
                {authorDisplay && authorDisplay !== "Anonymous User"
                  ? authorDisplay
                  : "Anonymous User"}
              </span>
            </span>
            <div className="flex items-center flex-wrap gap-x-1 text-2xs text-stone-400 font-medium tracking-tight">
              <span>Just now</span>
            </div>
          </div>
        </div>

        {/* Mock FeedItem Content */}
        <div className="text-base text-stone-700 leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </div>
      </div>

      <p className="text-sm text-stone-500 text-center mb-8 px-4 leading-relaxed">
        Double check for typos. You can edit or delete this post later if
        needed.
      </p>

      <div className="w-full flex flex-col gap-2">
        <button
          className="inline-flex w-full items-center justify-center rounded-control px-4 py-3 text-sm font-semibold text-white cursor-pointer transition-all active:scale-95 bg-logo-blue hover:brightness-110 shadow-lg shadow-blue-100"
          onClick={onConfirm}
        >
          Post now
        </button>

        <button
          className="w-full rounded-control px-4 py-3 text-sm font-semibold text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-600"
          onClick={onClose}
        >
          Wait, let me edit
        </button>
      </div>
    </div>
  );
};
