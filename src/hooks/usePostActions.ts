import { useState, useEffect } from "react";
import { Post } from "../types";
import { deletePost, updatePost } from "../lib/firebase";
import { interactionStore } from "../lib/interactionStore";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";

export const usePostActions = (post: Post) => {
  const { user } = useAuth();
  const { openModal } = useModal();
  const uid = user?.uid;

  // Initialize with props, but allow store to override
  const [localInteractions, setLocalInteractions] = useState(
    post.userInteractions || { agreed: {}, dissented: {} },
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.postContent);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Sync Server Props -> Store
  useEffect(() => {
    if (post.userInteractions) {
      interactionStore.syncFromServer(post.id, post.userInteractions);
    }
  }, [post.id, post.userInteractions]);

  // 2. Sync Store -> Local State (This connects Feed & Modal)
  useEffect(() => {
    // Subscribe returns an unsubscribe function
    return interactionStore.subscribe(post.id, (newData) => {
      setLocalInteractions(newData);
    });
  }, [post.id]);

  // Derived state
  const interactionState = {
    agreed: !!(uid && localInteractions?.agreed?.[uid]),
    dissented: !!(uid && localInteractions?.dissented?.[uid]),
  };

  const dynamicMetrics = {
    agreedCount: Object.keys(localInteractions?.agreed || {}).length,
    dissentedCount: Object.keys(localInteractions?.dissented || {}).length,
    replyCount: post.replyCount || 0,
  };

  const handleInteraction = (
    e: React.MouseEvent,
    type: "agreed" | "dissented",
  ) => {
    e.stopPropagation();
    if (!uid) return openModal("signin");

    // Delegate to the global store
    interactionStore.toggle(post.id, uid, type, post.parentPostId);
  };

  // ... (Edit/Delete logic remains the same)
  const handleCancel = () => {
    setEditContent(post.postContent);
    setIsEditing(false);
  };

  const handleEditSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editContent.trim() || editContent.trim() === post.postContent) {
      handleCancel();
      return;
    }

    setIsSaving(true);
    try {
      await updatePost(
        post.id,
        { postContent: editContent, editedAt: Date.now() },
        post.parentPostId,
      );
      setIsEditing(false);
    } catch (err) {
      console.error("failed to save changes:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTrigger = (e: React.MouseEvent) => {
    e.stopPropagation();
    openModal("deleteConfirm", {
      name: post.postContent || "this post",
      onConfirm: async () => {
        try {
          await deletePost(post.id, post.parentPostId);
        } catch (error) {
          console.error("failed to delete:", error);
        }
      },
    });
  };

  return {
    uid,
    localMetrics: dynamicMetrics,
    isEditing,
    setIsEditing,
    editContent,
    setEditContent,
    isSaving,
    interactionState,
    handleInteraction,
    handleCancel,
    handleEditSave,
    handleDeleteTrigger,
  };
};
