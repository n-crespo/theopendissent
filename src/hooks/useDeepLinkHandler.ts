import { useEffect, useRef } from "react";
import { getDeepLinkData } from "../lib/firebase";
import { useModal } from "../context/ModalContext";

/**
 * Handles incoming deep links via ?s=ID and optional ?p=PARENT_ID.
 * Automatically opens the appropriate modal based on link data.
 */
export const useDeepLinkHandler = () => {
  const { openModal } = useModal();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // If we already processed a link or there are no params, skip
    if (hasProcessed.current) return;

    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get("s");
    const parentId = params.get("p");

    if (!sharedId) return;

    const handleDeepLink = async () => {
      hasProcessed.current = true;

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
