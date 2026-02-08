import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getDeepLinkData } from "../lib/firebase";

/**
 * Handles incoming deep links via ?s=ID and optional ?p=PARENT_ID.
 * Automatically redirects to the /post/:id route.
 */
export const useDeepLinkHandler = () => {
  const navigate = useNavigate();
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

      if (data && data.displayPost) {
        // Construct the new path
        let targetPath = `/post/${data.displayPost.id}`;

        // If we need to highlight a specific reply, append it to the query string
        if (data.highlightReplyId) {
          targetPath += `?reply=${data.highlightReplyId}`;
        }

        // Navigate to the new page, replacing the current "deep link" URL in history
        navigate(targetPath, { replace: true });
      } else {
        // Fallback: just clear the params if data wasn't found
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    };

    handleDeepLink();
  }, [navigate]);
};
