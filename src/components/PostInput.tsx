import React, { useState } from "react";
import { User } from "firebase/auth";
import { push, serverTimestamp } from "firebase/database";
import { postsRef } from "../lib/firebase";

interface PostInputProps {
  user: User | null;
  onRequireAuth: () => void;
}

export const PostInput = ({ user, onRequireAuth }: PostInputProps) => {
  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    if (!user) {
      onRequireAuth();
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

  // this must return JSX
  return (
    <div id="inputs-container">
      <input
        type="text"
        id="input-field"
        placeholder="Speak your mind"
        maxLength={600}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button id="post-btn" className="btn" onClick={handleSubmit}>
        Post
      </button>
    </div>
  );
};
