import { useEffect, useState } from "react";
import { Post } from "../types";
import { deletePost, updatePost, EditWindowClosedError } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { toast } from "../lib/toast";
import { unpinPost } from "./usePosts";
import {
  EDIT_WINDOW_MS,
  getEditWindowRemainingMs,
  isWithinEditWindow,
} from "../utils";

const EDIT_WINDOW_CLOSED_MESSAGE = `Posts can only be edited within ${
  EDIT_WINDOW_MS / 60000
} minutes of posting. You can still delete it.`;

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
  const [editError, setEditError] = useState<string | null>(null);

  // wall-clock snapshot, refreshed by a single timer at the moment the edit
  // window closes (no per-second ticking)
  const [now, setNow] = useState(() => Date.now());
  const canEdit = isWithinEditWindow(post.timestamp, now);

  useEffect(() => {
    const remaining = getEditWindowRemainingMs(post.timestamp, now);
    if (remaining < 0) return;
    // +1 so the timer lands strictly after the deadline; if it still fires
    // early, `now` changes and this effect reschedules
    const timer = setTimeout(() => setNow(Date.now()), remaining + 1);
    return () => clearTimeout(timer);
  }, [post.timestamp, now]);

  const localMetrics = {
    replyCount: post.replyCount || 0,
  };

  const handleCancel = () => {
    setEditContent(post.postContent);
    setEditError(null);
    setIsEditing(false);
  };

  const saveEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === post.postContent) {
      handleCancel();
      return false;
    }

    // re-check against the real clock: the timer may be throttled in
    // background tabs, and the editor may have been opened inside the window
    if (!isWithinEditWindow(post.timestamp)) {
      setNow(Date.now());
      setEditError(EDIT_WINDOW_CLOSED_MESSAGE);
      return false;
    }

    setIsSaving(true);
    setEditError(null);
    try {
      await updatePost(post, { postContent: trimmed, editedAt: Date.now() });
      setIsEditing(false);
      return true;
    } catch (err) {
      console.error("failed to save:", err);
      setEditError(
        err instanceof EditWindowClosedError ||
          !isWithinEditWindow(post.timestamp)
          ? EDIT_WINDOW_CLOSED_MESSAGE
          : "Failed to save your edit. Please try again.",
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const runDelete = async () => {
    if (!uid) return;
    const noun = post.parentPostId ? "Reply" : "Post";
    try {
      await deletePost(post, uid);
      unpinPost(post.id);
      toast.success(`${noun} deleted`);
    } catch (error) {
      console.error("failed to delete:", error);
      toast.error({
        title: `Couldn't delete your ${noun.toLowerCase()}`,
        description: "Check your connection and try again.",
        action: { label: "Retry", onClick: runDelete },
      });
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
      onConfirm: runDelete,
    });
    return true;
  };

  return {
    uid,
    localMetrics,
    canEdit,
    isEditing,
    setIsEditing,
    editContent,
    setEditContent,
    isSaving,
    // surface the expiry as soon as the timer fires, not only on save
    editError:
      editError ?? (isEditing && !canEdit ? EDIT_WINDOW_CLOSED_MESSAGE : null),
    handleCancel,
    saveEdit,
    triggerDelete,
  };
};
