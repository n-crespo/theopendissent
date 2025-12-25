import React, { useState } from "react";
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

  const { user, loading } = useAuth();
  const { openModal } = useModal();

  const isReplyMode = !!parentPostId;
  const hasNoStance = isReplyMode && !currentStance;

  // character counter logic
  const MAX_CHARS = 600;
  const charsLeft = MAX_CHARS - content.length;
  const isNearLimit = charsLeft < 50;

  // TODO: update placeholder message to be more normal
  const defaultPlaceholder = isReplyMode
    ? `Replying as ${currentStance === "agreed" ? "Support" : "Dissent"}...`
    : "Speak your mind...";

  const activePlaceholder = hasNoStance
    ? "You must have a stance to reply"
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isDisabled = loading || isPosting || hasNoStance;

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex w-full flex-row gap-[7px]">
        <div className="relative flex-grow-[8]">
          <input
            type="text"
            maxLength={MAX_CHARS}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activePlaceholder}
            disabled={isDisabled}
            className={`w-full rounded-lg border p-[10px] text-[14px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all outline-none
              ${
                hasNoStance
                  ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed italic"
                  : "bg-white border-slate-200 focus:shadow-[0_6px_16_rgba(0,0,0,0.1)] focus:ring-1 focus:ring-logo-blue"
              }
            `}
          />

          {/* visual character count */}
          {!hasNoStance && content.length > 0 && (
            <span
              className={`absolute right-3 bottom-[-18px] text-[10px] font-bold uppercase tracking-tighter transition-colors ${isNearLimit ? "text-logo-red" : "text-slate-300"}`}
            >
              {charsLeft}
            </span>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isDisabled || !content.trim()}
          className={`
            flex-grow-[2] min-w-[85px] rounded-lg px-[10px] py-2.5 text-[14px] font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-transform duration-100
            bg-gradient-to-r from-logo-blue via-logo-green to-logo-red bg-[length:300%_100%] animate-shimmer
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
        <p className="px-1 text-[11px] font-bold text-logo-red ">
          Click "Agree" or "Dissent" on the post to unlock replies.
        </p>
      )}
    </div>
  );
};
