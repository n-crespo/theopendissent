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

  // Initialize from Store if available, else props
  const [localInteractions, setLocalInteractions] = useState(() =>
    interactionStore.get(post.id).agreed
      ? interactionStore.get(post.id)
      : post.userInteractions || { agreed: {}, dissented: {} },
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.postContent);
  const [isSaving, setIsSaving] = useState(false);

  // Sync Server Props -> Store (With User Protection)
  useEffect(() => {
    if (post.userInteractions) {
      // We pass 'uid' here so the store knows to merge CAREFULLY
      interactionStore.syncFromServer(post.id, post.userInteractions, uid);
    }
  }, [post.id, post.userInteractions, uid]);

  // Sync Store -> Local State
  useEffect(() => {
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

  const toggleInteraction = (type: "agreed" | "dissented") => {
    if (!uid) {
      openModal("signin");
      return false; // Return status so the component knows not to animate
    }
    interactionStore.toggle(post.id, uid, type, post.parentPostId);
    return true;
  };

  const handleCancel = () => {
    setEditContent(post.postContent);
    setIsEditing(false);
  };

  const saveEdit = async (e: React.MouseEvent) => {
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
    if (!uid) return openModal("signin");
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
    toggleInteraction,
    handleCancel,
    saveEdit,
    handleDeleteTrigger,
  };
};
