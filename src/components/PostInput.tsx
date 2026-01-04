import React, { useState, useRef, useEffect } from "react";
import { createPost } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";

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

  const isReplyMode = !!parentPostId;
  const hasNoStance = isReplyMode && !currentStance;

  const MAX_CHARS = 600;
  const charsLeft = MAX_CHARS - content.length;
  const isNearLimit = charsLeft < 50;

  /**
   * Snaps the textarea height to fit content exactly.
   * using 'auto' allows for an immediate shrink when text is deleted.
   */
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // reset to auto to force the browser to recalculate scrollHeight from scratch
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;

      // base height of 44px matches the h-11 button exactly
      const newHeight = Math.max(44, Math.min(scrollHeight, 240));
      textarea.style.height = `${newHeight}px`;

      textarea.style.overflowY = scrollHeight > 240 ? "auto" : "hidden";
    }
  }, [content]);

  const defaultPlaceholder = isReplyMode
    ? `I ${currentStance === "agreed" ? "agree" : "dissent"} because...`
    : "Speak your mind...";

  const activePlaceholder = hasNoStance
    ? "Choose a stance to reply"
    : placeholder || defaultPlaceholder;

  const handleSubmit = async () => {
    if (loading || isPosting || hasNoStance) return;
    if (!user) {
      openModal("signin");
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent || trimmedContent.length > MAX_CHARS) return;

    openModal("confirmPost", {
      content: trimmedContent,
      onConfirm: async () => {
        setIsPosting(true);
        try {
          await createPost(
            user.uid,
            trimmedContent,
            parentPostId,
            currentStance || undefined,
          );
          setContent("");
          closeModal();
        } catch (error) {
          console.error("failed to submit:", error);
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

  const isSubmitDisabled = loading || isPosting || hasNoStance;

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex w-full flex-row items-end gap-2">
        <div className="relative grow-8">
          <textarea
            ref={textareaRef}
            rows={1}
            maxLength={MAX_CHARS}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activePlaceholder}
            disabled={isSubmitDisabled}
            className={`w-full resize-none border px-3 py-2.25 text-[15px] transition-all
            outline-none block custom-scrollbar appearance-none leading-[1.6]
            ${
              hasNoStance
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed italic"
                : "bg-white border-border-subtle focus:border-logo-blue focus:ring-1 focus:ring-logo-blue/10"
            }
          `}
            style={{
              borderRadius: "var(--radius-input)",
              boxSizing: "border-box",
            }}
          />

          {!hasNoStance && content.length > 0 && (
            <span
              className={`absolute right-2 -bottom-3.5 text-[10px] font-bold uppercase tracking-tight transition-colors ${
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
            grow-2 min-w-22 h-11 flex items-center justify-center px-4 text-sm font-bold text-white transition-all duration-200
            bg-linear-to-r from-logo-blue via-logo-green to-logo-red bg-size-[300%_100%] animate-shimmer
            ${
              isSubmitDisabled
                ? "cursor-not-allowed grayscale-[0.6] opacity-60"
                : "cursor-pointer hover:shadow-md active:scale-95"
            }
          `}
          style={{ borderRadius: "var(--radius-button)" }}
        >
          {isPosting ? (
            <i className="bi bi-three-dots animate-pulse"></i>
          ) : isReplyMode ? (
            "Reply"
          ) : (
            "Post"
          )}
        </button>
      </div>

      {hasNoStance && (
        <p className="px-1 text-[11px] font-bold text-logo-red">
          Select "Agree" or "Dissent" on the post to unlock replies.
        </p>
      )}
    </div>
  );
};
