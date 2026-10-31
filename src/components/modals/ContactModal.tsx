import { useState } from "react";
import { contactAuthor } from "../../lib/firebase";
import { toast } from "../../lib/toast";
import { LoadingDots } from "../ui/LoadingDots";

interface Props {
  contentId: string;
  isReply: boolean;
  preview: string;
  onClose: () => void;
}

const MAX_MESSAGE_LENGTH = 500;

export const ContactModal = ({
  contentId,
  isReply,
  preview,
  onClose,
}: Props) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noun = isReply ? "reply" : "post";
  const charsLeft = MAX_MESSAGE_LENGTH - message.length;
  const isNearLimit = charsLeft < 50;

  const handleSend = async () => {
    setIsSending(true);
    setError(null);

    try {
      await contactAuthor(contentId, message.trim());
      toast.success("Notification sent");
      onClose();
    } catch (err) {
      console.error("failed to contact author:", err);
      setError("Couldn't send the notification. Please try again.");
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-semibold mb-3 text-stone-900 text-center">
        Contact this {isReply ? "replier" : "poster"}
      </h2>
      <p className="text-sm text-stone-500 text-center mb-6 leading-relaxed">
        They'll get a notification pinned to the top of their list. They can't
        reply to it, and you won't see who they are.
      </p>

      <div className="w-full bg-stone-50 border border-stone-200 rounded-card p-3 mb-4">
        <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap wrap-break-word line-clamp-3">
          {preview}
        </p>
      </div>

      <div className="relative mb-6">
        <textarea
          autoFocus
          aria-label={`Message to the author of this ${noun}`}
          placeholder="Add a message (optional)"
          maxLength={MAX_MESSAGE_LENGTH}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSending}
          className="resize-none w-full p-3 pb-6 border border-stone-200 rounded-control outline-none min-h-28 text-sm text-stone-900 focus:border-logo-blue focus:ring-1 focus:ring-logo-blue/10 transition-all"
        />
        <span
          className={`absolute right-3 bottom-3 text-2xs font-bold uppercase ${isNearLimit ? "text-logo-red" : "text-stone-300"}`}
        >
          {charsLeft}
        </span>
      </div>

      {error && (
        <div className="w-full bg-red-50 text-logo-red text-sm p-3 rounded-control mb-6 flex items-center gap-2">
          <i className="bi bi-exclamation-circle-fill"></i>
          <span className="leading-tight">{error}</span>
        </div>
      )}

      <div className="w-full flex flex-col gap-2">
        <button
          onClick={handleSend}
          disabled={isSending}
          className="inline-flex w-full items-center justify-center rounded-full bg-logo-blue px-4 py-2.5 text-sm font-semibold text-white cursor-pointer transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <LoadingDots className="text-white" />
          ) : (
            "Send notification"
          )}
        </button>

        <button
          onClick={onClose}
          disabled={isSending}
          className="w-full rounded-full px-4 py-2 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-100 disabled:opacity-50 disabled:hover:bg-transparent"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
