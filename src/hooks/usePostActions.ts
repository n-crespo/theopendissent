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
 * implements debouncing to prevent db flicker during rapid interactions.
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

  // refs for debouncing backend calls
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInteractingRef = useRef(false);

  // sync local state with prop updates, but pause if user is actively interacting
  useEffect(() => {
    if (!isInteractingRef.current) {
      setLocalInteractions(
        post.userInteractions || { agreed: {}, dissented: {} },
      );
    }
  }, [post.userInteractions]);

  // derive state from the interactions object
  const interactionState = {
    agreed: !!(uid && localInteractions?.agreed?.[uid]),
    dissented: !!(uid && localInteractions?.dissented?.[uid]),
  };

  // derive metrics dynamically
  const dynamicMetrics = {
    agreedCount: Object.keys(localInteractions?.agreed || {}).length,
    dissentedCount: Object.keys(localInteractions?.dissented || {}).length,
    replyCount: post.replyCount || 0,
  };

  const handleInteraction = async (
    e: React.MouseEvent,
    type: "agreed" | "dissented",
  ) => {
    e.stopPropagation();
    if (!uid) return openModal("signin");

    // 1. Optimistic Update
    // mark user as interacting to block incoming prop overwrites (flicker prevention)
    isInteractingRef.current = true;

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

    // 2. Debounced Backend Call
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        // determine final intent based on the *latest* local state
        const finalAgreed = !!nextInteractions.agreed[uid];
        const finalDissented = !!nextInteractions.dissented[uid];

        // check against server truth (post.userInteractions) to minimize writes
        const serverAgreed = !!post.userInteractions?.agreed?.[uid];
        const serverDissented = !!post.userInteractions?.dissented?.[uid];

        // execute only the necessary diff
        if (finalAgreed && !serverAgreed) {
          await addInteraction(post.id, uid, "agreed", post.parentPostId);
          if (serverDissented) {
            // cleanup the other side if needed (though backend triggers usually handle this, explicit is safer)
            await removeInteraction(
              post.id,
              uid,
              "dissented",
              post.parentPostId,
            );
          }
        } else if (finalDissented && !serverDissented) {
          await addInteraction(post.id, uid, "dissented", post.parentPostId);
          if (serverAgreed) {
            await removeInteraction(post.id, uid, "agreed", post.parentPostId);
          }
        } else if (!finalAgreed && !finalDissented) {
          // user removed their stance entirely
          if (serverAgreed)
            await removeInteraction(post.id, uid, "agreed", post.parentPostId);
          if (serverDissented)
            await removeInteraction(
              post.id,
              uid,
              "dissented",
              post.parentPostId,
            );
        }
      } catch (err) {
        console.error("interaction sync failed", err);
        // rollback on error
        setLocalInteractions(
          post.userInteractions || { agreed: {}, dissented: {} },
        );
      } finally {
        // release the lock
        isInteractingRef.current = false;
        debounceTimerRef.current = null;
      }
    }, 1000); // 1 second debounce
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
