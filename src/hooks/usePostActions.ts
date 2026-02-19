import { useState, useEffect } from "react";
import { Post } from "../types";
import { deletePost, updatePost } from "../lib/firebase";
import { interactionStore } from "../lib/interactionStore";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";

/**
 * Manages the lifecycle and actions for a single post or reply.
 */
export const usePostActions = (post: Post) => {
  const { user } = useAuth();
  const { openModal } = useModal();
  const uid = user?.uid;

  // Initialize from Store (if available) or Server Data
  const [localScores, setLocalScores] = useState<Record<string, number>>(() => {
    const cached = interactionStore.get(post.id);
    // if cache has keys, use it, otherwise fall back to post data
    return Object.keys(cached).length > 0
      ? cached
      : post.userInteractions || {};
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.postContent);
  const [isSaving, setIsSaving] = useState(false);

  // sync server props to the store
  useEffect(() => {
    if (post.userInteractions) {
      interactionStore.syncFromServer(post.id, post.userInteractions, uid);
    }
  }, [post.id, post.userInteractions, uid]);

  // sync store changes to local state
  useEffect(() => {
    return interactionStore.subscribe(post.id, (newScores) => {
      setLocalScores(newScores);
    });
  }, [post.id]);

  const currentScore = uid ? localScores[uid] : undefined;

  const localMetrics = {
    replyCount: post.replyCount || 0,
  };

  const handleScoreChange = (newScore: number) => {
    if (!uid) {
      openModal("signin");
      return;
    }
    interactionStore.setScore(post.id, uid, newScore, post.parentPostId);
  };

  const handleCancel = () => {
    setEditContent(post.postContent);
    setIsEditing(false);
  };

  const saveEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === post.postContent) {
      handleCancel();
      return false;
    }

    setIsSaving(true);
    try {
      await updatePost(
        post.id,
        { postContent: trimmed, editedAt: Date.now() },
        post.parentPostId,
      );
      setIsEditing(false);
      return true;
    } catch (err) {
      console.error("failed to save:", err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const triggerDelete = () => {
    if (!uid) {
      openModal("signin");
      return false;
    }
    openModal("deleteConfirm", {
      name: post.postContent || "this post",
      onConfirm: async () => {
        try {
          await deletePost(post.id, uid, post.parentPostId);
        } catch (error) {
          console.error("failed to delete:", error);
        }
      },
    });
    return true;
  };

  return {
    uid,
    localMetrics,
    currentScore, // (-5 to 5) or undefined
    handleScoreChange,

    isEditing,
    setIsEditing,
    editContent,
    setEditContent,
    isSaving,
    handleCancel,
    saveEdit,
    triggerDelete,
  };
};
