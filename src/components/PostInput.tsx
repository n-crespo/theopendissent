import React, { useState } from "react";
import { push, serverTimestamp } from "firebase/database";
import { postsRef } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";

/**
 * Handles user input and database submission for new posts.
 */
export const PostInput = () => {
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const { user, loading } = useAuth();
  const { openModal } = useModal();

  const handleSubmit = async () => {
    // prevent actions while initializing or mid-request
    if (loading || isPosting) return;

    if (!user) {
      openModal("signin");
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    setIsPosting(true);

    try {
      await push(postsRef, {
        userId: user.uid,
        postContent: trimmedContent,
        timestamp: serverTimestamp(),
        metrics: {
          agreedCount: 0,
          disagreedCount: 0,
          interestedCount: 0,
        },
        userInteractions: {
          agreed: {},
          interested: {},
          disagreed: {},
        },
      });
      setContent("");
    } catch (error) {
      // log error for debugging
      console.error("Failed to post:", error);
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

  return (
    <div id="inputs-container">
      <input
        type="text"
        id="input-field"
        maxLength={600}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={loading ? "Checking connection..." : "Speak your mind"}
        disabled={isDisabled}
      />
      <button
        id="post-btn"
        className="btn"
        onClick={handleSubmit}
        disabled={isDisabled || !content.trim()}
      >
        {isPosting ? "..." : "Post"}
      </button>
    </div>
  );
};
