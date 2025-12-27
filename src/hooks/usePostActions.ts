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

  const [localMetrics, setLocalMetrics] = useState(post.metrics);
  const [localInteractions, setLocalInteractions] = useState(
    post.userInteractions || { agreed: {}, dissented: {} },
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.postContent);
  const [isSaving, setIsSaving] = useState(false);

  const isOptimisticRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOptimisticRef.current) {
      setLocalMetrics(post.metrics);
      setLocalInteractions(
        post.userInteractions || { agreed: {}, dissented: {} },
      );
    }
  }, [post.metrics, post.userInteractions]);

  const interactionState = {
    agreed: !!(uid && localInteractions?.agreed?.[uid]),
    dissented: !!(uid && localInteractions?.dissented?.[uid]),
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

    const nextMetrics = { ...localMetrics };

    if (wasActive) {
      nextMetrics[`${type}Count` as keyof typeof nextMetrics] = Math.max(
        0,
        nextMetrics[`${type}Count` as keyof typeof nextMetrics] - 1,
      );
    } else {
      nextMetrics[`${type}Count` as keyof typeof nextMetrics]++;
      if (wasOtherActive) {
        nextMetrics[`${otherType}Count` as keyof typeof nextMetrics] = Math.max(
          0,
          nextMetrics[`${otherType}Count` as keyof typeof nextMetrics] - 1,
        );
      }
    }

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

    setLocalMetrics(nextMetrics);
    setLocalInteractions(nextInteractions);

    try {
      if (wasActive) {
        await removeInteraction(post.id, uid, type);
      } else {
        await addInteraction(post.id, uid, type);
        if (wasOtherActive) await removeInteraction(post.id, uid, otherType);
      }
    } catch (err) {
      setLocalMetrics(post.metrics);
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
    localMetrics,
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
