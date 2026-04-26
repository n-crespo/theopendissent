import { useState } from "react";
import { Post } from "../types";
import { deletePost, updatePost } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";

/**
 * Manages the lifecycle and actions for a single post or reply.
 */
export const usePostActions = (post: Post) => {
  const { user } = useAuth();
  const { openModal } = useModal();
  const uid = user?.uid;

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.postContent);
  const [isSaving, setIsSaving] = useState(false);

  const localMetrics = {
    replyCount: post.replyCount || 0,
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
      authorDisplay: post.authorDisplay,
      isThreadAuthor: post.isThreadAuthor,
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
