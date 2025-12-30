import { useEffect, useRef } from "react";
import { getDeepLinkData } from "../lib/firebase";
import { useModal } from "../context/ModalContext";

/**
 * Handles deep-linking via ?s=ID and optional ?p=PARENT_ID.
 * Automatically opens the appropriate modal based on link data.
 */
export const useSharedPost = () => {
  const { openModal } = useModal();
  const hasprocessed = useRef(false);

  useEffect(() => {
    if (hasprocessed.current) return;

    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get("s");
    const parentId = params.get("p");

    if (!sharedId) return;

    const handleDeepLink = async () => {
      hasprocessed.current = true;

      // resolve post data from the library
      const data = await getDeepLinkData(sharedId, parentId);
      if (!data) return;

      openModal("postDetails", {
        post: data.displayPost,
        highlightReplyId: data.highlightReplyId,
      });

      // clear params from url
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    };

    handleDeepLink();
  }, [openModal]);
};
