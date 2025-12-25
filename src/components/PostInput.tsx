import React, { useState } from "react";
import { push, ref, serverTimestamp } from "firebase/database";
import { db, postsRef } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";

interface PostInputProps {
  parentPostId?: string;
  placeholder?: string;
}

export const PostInput = ({ parentPostId, placeholder }: PostInputProps) => {
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const { user, loading } = useAuth();
  const { openModal } = useModal();

  const handleSubmit = async () => {
    if (loading || isPosting) return;
    if (!user) {
      openModal("signin");
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    setIsPosting(true);
    const targetRef = parentPostId
      ? ref(db, `replies/${parentPostId}`)
      : postsRef;

    try {
      await push(targetRef, {
        userId: user.uid,
        postContent: trimmedContent,
        timestamp: serverTimestamp(),
        metrics: { agreedCount: 0, dissentedCount: 0, replyCount: 0 },
        userInteractions: { agreed: {}, dissented: {} },
        ...(parentPostId && { parentPostId }),
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

  const isDisabled = loading || isPosting;
  const defaultPlaceholder = parentPostId
    ? "Write a reply..."
    : "Speak your mind...";

  return (
    <div className="flex w-full flex-row gap-[7px]">
      <input
        type="text"
        maxLength={600}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          loading ? "Checking connection..." : placeholder || defaultPlaceholder
        }
        disabled={isDisabled}
        className="flex-grow-[8] rounded-lg border border-slate-200 bg-white p-[10px] text-[14px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all outline-none focus:shadow-[0_6px_16px_rgba(0,0,0,0.1)] disabled:bg-slate-50 disabled:text-slate-400"
      />

      <button
        onClick={handleSubmit}
        disabled={isDisabled || !content.trim()}
        className={`
          flex-grow-[2] min-w-[85px] cursor-pointer rounded-lg px-[10px] py-2.5 text-[14px] font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-transform duration-100
          bg-gradient-to-r from-logo-blue via-logo-green to-logo-red bg-[length:300%_100%] animate-shimmer
          hover:animate-jiggle active:scale-95 disabled:cursor-not-allowed
        `}
      >
        {isPosting ? (
          <i className="bi bi-three-dots animate-pulse"></i>
        ) : parentPostId ? (
          "Reply"
        ) : (
          "Post"
        )}
      </button>
    </div>
  );
};
