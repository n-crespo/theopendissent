import { useEffect, useRef } from "react";
import { getPostById } from "../lib/firebase";
import { useModal } from "../context/ModalContext";

/**
 * Handles deep-linking via ?s=ID and optional ?p=PARENT_ID.
 * Fetches the post, identifies if it's a reply or top-level post,
 * and automatically opens the appropriate modal.
 */
export const useSharedPost = () => {
  const { openModal } = useModal();
  const hasprocessed = useRef(false);

  useEffect(() => {
    if (hasprocessed.current) return;

    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get("s");
    const parentId = params.get("p"); // new: required for replies

    if (!sharedId) return;

    const handleDeepLink = async () => {
      hasprocessed.current = true;

      // if p exists, we are looking for a reply. if not, a top-level post.
      const targetPost = await getPostById(sharedId, parentId || undefined);
      if (!targetPost) return;

      let displayPost = targetPost;
      let highlightReplyId = null;

      if (parentId) {
        // fetch the parent to populate the modal background
        const parent = await getPostById(parentId);
        if (parent) {
          displayPost = parent;
          highlightReplyId = sharedId;
        }
      }

      openModal("postDetails", {
        post: displayPost,
        highlightReplyId: highlightReplyId,
      });

      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    };

    handleDeepLink();
  }, [openModal]);
};
