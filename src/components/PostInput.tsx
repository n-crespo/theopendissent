import React, { useState } from "react";
import { push, ref, serverTimestamp } from "firebase/database";
import { db, postsRef } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";

interface PostInputProps {
  parentPostId?: string;
  placeholder?: string;
  currentStance?: "agreed" | "dissented" | null; // new prop to track stance
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

  // logic for reply restriction
  const isReplyMode = !!parentPostId;
  const hasNoStance = isReplyMode && !currentStance;

  const handleSubmit = async () => {
    if (loading || isPosting || hasNoStance) return;
    if (!user) {
      openModal("signin");
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) return;

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
          userInteractionType: currentStance, // uses the user's stance on the parent
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
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isDisabled = loading || isPosting || hasNoStance;

  // placeholder logic
  let activePlaceholder = placeholder;
  if (loading) {
    activePlaceholder = "Checking connection...";
  } else if (hasNoStance) {
    activePlaceholder = "You must have a stance to reply";
  } else if (!placeholder) {
    activePlaceholder = isReplyMode
      ? `I ${currentStance === "agreed" ? "agree because" : "dissent because"}...`
      : "Speak your mind...";
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full flex-row gap-1.75">
        <input
          type="text"
          maxLength={600}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={activePlaceholder}
          disabled={isDisabled}
          className={`grow-8 rounded-lg border p-2.5 text-[14px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all outline-none
            ${
              hasNoStance
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed italic"
                : "bg-white border-slate-200 focus:shadow-[0_6px_16px_rgba(0,0,0,0.1)] focus:ring-1 focus:ring-logo-blue"
            }
            disabled:opacity-70`}
        />

        <button
          onClick={handleSubmit}
          disabled={isDisabled || !content.trim()}
          className={`
            grow-2 min-w-21.25 rounded-lg px-2.5 py-2.5 text-[14px] font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-transform duration-100
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
        <p className="px-1 text-[11px] font-bold text-logo-red  animate-pulse">
          Click "Agree" or "Dissent" on the post to unlock replies.
        </p>
      )}
    </div>
  );
};
