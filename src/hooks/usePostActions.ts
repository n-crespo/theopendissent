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

    if (isOptimisticRef.current) clearTimeout(isOptimisticRef.current);
    isOptimisticRef.current = setTimeout(() => {
      isOptimisticRef.current = null;
    }, 2000);

    const wasActive = interactionState[type];
    const nextMetrics = { ...localMetrics };
    const nextInteractions = JSON.parse(JSON.stringify(localInteractions));

    if (wasActive) {
      nextMetrics[`${type}Count` as keyof typeof nextMetrics]--;
      if (nextInteractions[type]) delete nextInteractions[type][uid];
    } else {
      nextMetrics[`${type}Count` as keyof typeof nextMetrics]++;
      if (!nextInteractions[type]) nextInteractions[type] = {};
      nextInteractions[type][uid] = true;

      const other = type === "agreed" ? "dissented" : "agreed";
      if (interactionState[other]) {
        nextMetrics[`${other}Count` as keyof typeof nextMetrics]--;
        if (nextInteractions[other]) delete nextInteractions[other][uid];
      }
    }

    setLocalMetrics(nextMetrics);
    setLocalInteractions(nextInteractions);

    try {
      if (wasActive) {
        await removeInteraction(post.id, uid, type);
      } else {
        await addInteraction(post.id, uid, type);
        const other = type === "agreed" ? "dissented" : "agreed";
        if (interactionState[other])
          await removeInteraction(post.id, uid, other);
      }
    } catch (err) {
      setLocalMetrics(post.metrics);
      setLocalInteractions(post.userInteractions);
    }
  };

  const handleEditSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editContent.trim() === post.postContent) return setIsEditing(false);

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
    handleEditSave,
  };
};
