import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPost } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import { pinPostToTop } from "../../hooks/usePosts";

interface PostInputProps {
  parentPostId?: string;
  placeholder?: string;
  currentStance?: "agreed" | "dissented" | null;
}

export const PostInput = ({
  parentPostId,
  placeholder,
  currentStance,
}: PostInputProps) => {
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { user, loading } = useAuth();
  const { openModal, closeModal } = useModal();

  // --- Logic State ---
  const isReplyMode = !!parentPostId;
  const hasNoStance = isReplyMode && !currentStance;
  const isSubmitDisabled =
    loading || isPosting || hasNoStance || !content.trim();

  const MAX_CHARS = 600;
  const charsLeft = MAX_CHARS - content.length;
  const isNearLimit = charsLeft < 50;

  // --- Auto-resize Logic ---
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.max(44, Math.min(scrollHeight, 240));
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = scrollHeight > 240 ? "auto" : "hidden";
    }
  }, [content]);

  // --- Dynamic UI Strings ---
  const activePlaceholder = useMemo(() => {
    if (hasNoStance) return "Choose a stance to reply!";
    if (placeholder) return placeholder;
    return isReplyMode
      ? `I ${currentStance === "agreed" ? "agree" : "dissent"} because...`
      : "Speak your mind...";
  }, [hasNoStance, placeholder, isReplyMode, currentStance]);

  const buttonText = isPosting ? null : isReplyMode ? "Reply" : "Post";

  // --- Handlers ---
  const handleSubmit = async () => {
    if (isSubmitDisabled) return;
    if (!user) return openModal("signin");

    const trimmedContent = content.trim();

    openModal("confirmPost", {
      content: trimmedContent,
      onConfirm: async () => {
        setIsPosting(true);
        try {
          const newKey = await createPost(
            user.uid,
            trimmedContent,
            parentPostId,
            currentStance || undefined,
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
    <div className="flex w-full flex-col gap-2">
      {/* Container spacing fix: added mt-4 */}
      <div className="flex w-full flex-row items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            rows={1}
            maxLength={MAX_CHARS}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activePlaceholder}
            disabled={isPosting || loading || hasNoStance}
            className={`w-full resize-none border px-3 py-2.5 pr-6 text-[15px] transition-all
              outline-none block custom-scrollbar shadow-sm rounded-(--radius-input)
              ${
                hasNoStance
                  ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-white border-border-subtle focus:border-logo-blue focus:ring-1 focus:ring-logo-blue/10"
              }
            `}
          />

          {!hasNoStance && content.length > 0 && (
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
          className={`
            min-w-24 h-11 flex items-center justify-center px-4 text-sm font-bold text-white transition-all duration-200 shadow-sm
            bg-linear-to-r from-logo-blue via-logo-green to-logo-red bg-size-[300%_100%] animate-shimmer
            rounded-(--radius-button)
            ${
              isSubmitDisabled
                ? "grayscale-[0.6] opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:shadow-md active:scale-95"
            }
          `}
        >
          {isPosting ? (
            <i className="bi bi-three-dots animate-pulse text-lg"></i>
          ) : (
            buttonText
          )}
        </button>
      </div>

      {hasNoStance && (
        <p className="px-1 text-[11px] font-bold text-logo-red animate-in fade-in slide-in-from-top-1">
          Select "Agree" or "Dissent" on the post to unlock replies.
        </p>
      )}
    </div>
  );
};
