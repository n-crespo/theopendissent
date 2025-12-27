import { useEffect, useRef } from "react";
import { getPostById } from "../lib/firebase";
import { useModal } from "../context/ModalContext";

/**
 * Handles deep-linking via the ?s=POST_ID query parameter.
 * fetches the post, identifies if it's a reply or top-level post,
 * and automatically opens the appropriate modal.
 */
export const useSharedPost = () => {
  const { openModal } = useModal();
  const hasprocessed = useRef(false);

  useEffect(() => {
    // prevent double-processing in strict mode
    if (hasprocessed.current) return;

    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get("s");

    if (!sharedId) return;

    const handleDeepLink = async () => {
      hasprocessed.current = true;

      const targetPost = await getPostById(sharedId);
      if (!targetPost) return;

      // if it's a reply, we need the parent to open the correct view
      let displayPost = targetPost;
      if (targetPost.parentPostId) {
        const parent = await getPostById(targetPost.parentPostId);
        if (parent) {
          displayPost = parent;
        }
      }

      // trigger the modal.
      // payload includes 'highlightReplyId' to let PostDetailsView know what to focus on.
      openModal("postDetails", {
        post: displayPost,
        highlightReplyId: targetPost.parentPostId ? sharedId : null,
      });

      // clean the URL without refreshing to keep it tidy
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    };

    handleDeepLink();
  }, [openModal]);
};
