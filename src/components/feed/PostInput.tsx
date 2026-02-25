import React, {
  useState,
  useRef,
  useLayoutEffect,
  useMemo,
  useEffect,
} from "react";
import { createPost } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import { pinPostToTop } from "../../hooks/usePosts";

interface PostInputProps {
  parentPostId?: string;
  placeholder?: string;
  currentScore?: number;
  onSubmitOverride?: (content: string) => void;
}

const emojis = ["🎤", "🗣️", "📣", "📢", "🧠"];

export const PostInput = ({
  parentPostId,
  placeholder,
  currentScore,
  onSubmitOverride,
}: PostInputProps) => {
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showLockedText, setShowLockedText] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // pick emoji once per component mount, rather than once per page load
  const emoji = useMemo(
    () => emojis[Math.floor(Math.random() * emojis.length)],
    [],
  );

  const { user, loading } = useAuth();
  const { openModal, closeModal } = useModal();

  // logic state
  const isReplyMode = !!parentPostId;
  const hasNoInteraction = isReplyMode && currentScore === undefined;

  // prevent empty submissions
  const isSubmitDisabled =
    loading || isPosting || hasNoInteraction || !content.trim();

  const MAX_CHARS = 600;
  const charsLeft = MAX_CHARS - content.length;
  const isNearLimit = charsLeft < 50;

  // delay the locked text slightly to avoid a flash when loading existing scores
  useEffect(() => {
    if (hasNoInteraction) {
      const timer = setTimeout(() => setShowLockedText(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowLockedText(false);
    }
  }, [hasNoInteraction]);

  // useLayoutEffect prevents visual jitter when altering DOM dimensions
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.max(44, Math.min(scrollHeight, 240));
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = scrollHeight > 240 ? "auto" : "hidden";
    }
  }, [content]);

  const activePlaceholder = useMemo(() => {
    if (showLockedText) return "🔒 Score the post to unlock replies!";
    if (placeholder) return placeholder;

    // assume we will resolve to an interacted state to avoid flashing text
    if (isReplyMode) {
      return emoji + " Explain your stance...";
    }

    return emoji + " Speak your mind...";
  }, [showLockedText, placeholder, isReplyMode, emoji]);

  const buttonText = isPosting ? null : isReplyMode ? "Reply" : "Post";

  const handleSubmit = async () => {
    const trimmedContent = content.trim();
    // intercept submission for the about modal demonstration
    if (onSubmitOverride) {
      onSubmitOverride(trimmedContent);
      setContent("");
      return;
    }

    if (isSubmitDisabled) return;
    if (!user) return openModal("signin");

    openModal("confirmPost", {
      content: trimmedContent,
      onConfirm: async () => {
        setIsPosting(true);
        try {
          const newKey = await createPost(
            user.uid,
            trimmedContent,
            parentPostId,
            currentScore,
          );

          if (newKey) pinPostToTop(newKey);
          setContent("");
          closeModal();
        } catch (error) {
          console.error("failed to submit post:", error);
        } finally {
          setIsPosting(false);
        }
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex w-full flex-row gap-0">
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          rows={1}
          maxLength={MAX_CHARS}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={activePlaceholder}
          disabled={isPosting || loading || hasNoInteraction}
          className={`w-full resize-none border px-3 py-2.5 pr-6 text-[15px] transition-all
            outline-none block custom-scrollbar shadow-sm rounded-xl
            ${
              hasNoInteraction
                ? "bg-slate-50 border-slate-200 cursor-not-allowed"
                : "bg-white border-border-subtle focus:border-logo-blue focus:ring-1 focus:ring-logo-blue/10"
            }
          `}
        />

        {!hasNoInteraction && content.length > 0 && (
          <span
            className={`absolute right-2 bottom-0 text-[10px] font-bold uppercase tracking-tight transition-colors ${
              isNearLimit ? "text-logo-red" : "text-slate-300"
            }`}
          >
            {charsLeft}
          </span>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitDisabled}
        aria-hidden={hasNoInteraction}
        tabIndex={hasNoInteraction ? -1 : 0}
        className={`
          flex items-center justify-center font-bold text-white transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap
          bg-linear-to-r from-logo-blue via-logo-green to-logo-red bg-size-[300%_100%] animate-shimmer
          rounded-xl h-[44px]
          ${
            hasNoInteraction
              ? "w-0 min-w-0 px-0 opacity-0 pointer-events-none border-none"
              : "w-24 min-w-24 px-4 text-sm opacity-100 shadow-2xl ml-2"
          }
          ${
            isSubmitDisabled && !hasNoInteraction
              ? "grayscale-[0.6] opacity-50 cursor-not-allowed"
              : !hasNoInteraction
                ? "cursor-pointer hover:shadow-2xl active:scale-95"
                : ""
          }
        `}
      >
        {isPosting ? (
          <i className="bi bi-three-dots animate-pulse"></i>
        ) : (
          buttonText
        )}
      </button>
    </div>
  );
};
