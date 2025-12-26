import React, { useState, useRef, useEffect } from "react";
import { push, ref, serverTimestamp } from "firebase/database";
import { db, postsRef } from "../lib/firebase";
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
  const { openModal } = useModal();

  const isReplyMode = !!parentPostId;
  const hasNoStance = isReplyMode && !currentStance;

  const MAX_CHARS = 600;
  const charsLeft = MAX_CHARS - content.length;
  const isNearLimit = charsLeft < 50;

  // auto-expand height logic with max-height constraint
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 240); // 240px is approx 15rem
      textarea.style.height = `${newHeight}px`;

      // show scrollbar only if we've hit the max height
      textarea.style.overflowY =
        textarea.scrollHeight > 240 ? "auto" : "hidden";
    }
  }, [content]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // start calculation from the base height
      textarea.style.height = "41px";
      const newHeight = Math.max(41, Math.min(textarea.scrollHeight, 240));
      textarea.style.height = `${newHeight}px`;

      textarea.style.overflowY =
        textarea.scrollHeight > 240 ? "auto" : "hidden";
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

    setIsPosting(true);
    const targetRef = isReplyMode
      ? ref(db, `replies/${parentPostId}`)
      : postsRef;

    try {
      await push(targetRef, {
        userId: user.uid,
        postContent: trimmedContent,
        timestamp: serverTimestamp(),
        metrics: { agreedCount: 0, dissentedCount: 0, replyCount: 0 },
        userInteractions: { agreed: {}, dissented: {} },
        ...(isReplyMode && {
          parentPostId,
          userInteractionType: currentStance,
        }),
      });
      setContent("");
    } catch (error) {
      console.error("failed to submit:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isDisabled = loading || isPosting || hasNoStance;

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex w-full flex-row items-end gap-1.75">
        <div className="relative grow-8">
          <textarea
            ref={textareaRef}
            rows={1}
            maxLength={MAX_CHARS}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activePlaceholder}
            disabled={isDisabled}
            className={`w-full resize-none rounded-lg border p-2.5 text-[16px] md:text-[14px]
            min-h-10.25 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all
            outline-none block max-h-60 custom-scrollbar appearance-none leading-[1.4]
            ${
              hasNoStance
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed italic"
                : "bg-white border-slate-200 focus:shadow-[0_6px_16px_rgba(0,0,0,0.1)] focus:ring-1 focus:ring-logo-blue"
            }
          `}
          />

          {!hasNoStance && content.length > 0 && (
            <span
              className={`absolute right-3 -bottom-4.5 text-[10px] font-bold uppercase tracking-tighter transition-colors ${isNearLimit ? "text-logo-red" : "text-slate-300"}`}
            >
              {charsLeft}
            </span>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isDisabled || !content.trim()}
          className={`
            grow-2 min-w-21.25 h-[41px] flex items-center justify-center rounded-lg px-2.5 py-2.5 text-[14px] font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-transform duration-100
            bg-linear-to-r from-logo-blue via-logo-green to-logo-red bg-size-[300%_100%] animate-shimmer
            ${isDisabled || !content.trim() ? "cursor-not-allowed" : "cursor-pointer hover:animate-jiggle active:scale-95"}
          `}
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
          Click "Agree" or "Dissent" to unlock replies.
        </p>
      )}
    </div>
  );
};
