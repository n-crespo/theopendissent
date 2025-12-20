import React, { useState } from "react";
import { push, serverTimestamp } from "firebase/database";
import { postsRef } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";

export const PostInput = () => {
  const [content, setContent] = useState("");
  const { user, loading } = useAuth();
  const { openModal } = useModal();

  const handleSubmit = async () => {
    if (loading) return; // prevent actions while initializing
    if (!user) {
      openModal("signin");
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    const newPost = {
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
    };

    try {
      await push(postsRef, newPost);
      setContent("");
    } catch (error) {
      console.error("Failed to post:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

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
        disabled={loading}
      />
      <button
        id="post-btn"
        className="btn"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "..." : "Post"}
      </button>
    </div>
  );
};
