import { useState, useEffect, useRef } from "react";
import { Post } from "../types";
import {
  addInteraction,
  deletePost,
  removeInteraction,
  updatePost,
} from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";

/**
 * manages post interactions, editing, deletion, and sharing.
 */
export const usePostActions = (post: Post) => {
  const { user } = useAuth();
  const { openModal } = useModal();
  const uid = user?.uid;

  const [localInteractions, setLocalInteractions] = useState(
    post.userInteractions || { agreed: {}, dissented: {} },
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.postContent);
  const [isSaving, setIsSaving] = useState(false);

  const isOptimisticRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOptimisticRef.current) {
      setLocalInteractions(
        post.userInteractions || { agreed: {}, dissented: {} },
      );
    }
  }, [post.userInteractions]);

  // derive counts and state from the interactions object
  const interactionState = {
    agreed: !!(uid && localInteractions?.agreed?.[uid]),
    dissented: !!(uid && localInteractions?.dissented?.[uid]),
  };

  const dynamicMetrics = {
    agreedCount: Object.keys(localInteractions?.agreed || {}).length,
    dissentedCount: Object.keys(localInteractions?.dissented || {}).length,
    replyCount: post.metrics?.replyCount || 0, // still using managed counter
  };

  const handleInteraction = async (
    e: React.MouseEvent,
    type: "agreed" | "dissented",
  ) => {
    e.stopPropagation();
    if (!uid) return openModal("signin");

    if (isOptimisticRef.current) clearTimeout(isOptimisticRef.current);
    isOptimisticRef.current = setTimeout(() => {
      isOptimisticRef.current = null;
    }, 2000);

    const otherType = type === "agreed" ? "dissented" : "agreed";
    const wasActive = !!localInteractions?.[type]?.[uid];
    const wasOtherActive = !!localInteractions?.[otherType]?.[uid];

    const nextInteractions = {
      agreed: { ...(localInteractions?.agreed || {}) },
      dissented: { ...(localInteractions?.dissented || {}) },
    };

    if (wasActive) {
      delete nextInteractions[type][uid];
    } else {
      nextInteractions[type][uid] = true;
      if (wasOtherActive) {
        delete nextInteractions[otherType][uid];
      }
    }

    setLocalInteractions(nextInteractions);

    try {
      if (wasActive) {
        await removeInteraction(post.id, uid, type, post.parentPostId);
      } else {
        await addInteraction(post.id, uid, type, post.parentPostId);
        if (wasOtherActive) {
          await removeInteraction(post.id, uid, otherType, post.parentPostId);
        }
      }
    } catch (err) {
      setLocalInteractions(
        post.userInteractions || { agreed: {}, dissented: {} },
      );
    }
  };

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
    localMetrics: dynamicMetrics, // returning derived metrics
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
