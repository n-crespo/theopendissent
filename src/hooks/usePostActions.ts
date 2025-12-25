import { useState, useEffect, useRef } from "react";
import { Post } from "../types";
import { addInteraction, removeInteraction, updatePost } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";

export const usePostActions = (post: Post) => {
  const { user } = useAuth();
  const { openModal } = useModal();
  const uid = user?.uid;

  const [localMetrics, setLocalMetrics] = useState(post.metrics);
  const [localInteractions, setLocalInteractions] = useState(
    post.userInteractions,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.postContent);
  const [showMenu, setShowMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const isOptimisticRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCancel = () => {
    setEditContent(post.postContent);
    setIsEditing(false);
  };

  /**
   * synchronizes local state with incoming post props
   */
  useEffect(() => {
    if (!isOptimisticRef.current) {
      setLocalMetrics(post.metrics);
      setLocalInteractions(post.userInteractions);
    }
  }, [post.metrics, post.userInteractions]);

  /**
   * handles closing the menu when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

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

    // optimistic lock
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
      // only decrement the other count if the user was actually interacting with it
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
      // revert on error
      setLocalMetrics(post.metrics);
      setLocalInteractions(
        post.userInteractions || { agreed: {}, dissented: {} },
      );
    }
  };

  const handleEditSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editContent.trim() || editContent.trim() === post.postContent) {
      handleCancel();
      return;
    }

    setIsSaving(true);
    try {
      await updatePost(post.id, {
        postContent: editContent,
        editedAt: Date.now(),
      });
      setIsEditing(false);
    } catch (err) {
      alert("failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    uid,
    localMetrics,
    isEditing,
    setIsEditing,
    editContent,
    setEditContent,
    showMenu,
    setShowMenu,
    isSaving,
    menuRef,
    interactionState,
    handleInteraction,
    handleCancel,
    handleEditSave,
  };
};
