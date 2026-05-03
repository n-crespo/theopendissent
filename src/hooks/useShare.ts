import { useCallback } from "react";
import { Post } from "../types";
import { buildShareUrl } from "../lib/updateBuilders";

/**
 * handles sharing logic and generates links for Social Previews.
 */
export const useShare = () => {
  const sharePost = useCallback(async (post: Post) => {
    const shareUrl = buildShareUrl(post, window.location.origin);

    const shareData = {
      title: "The Open Dissent",
      text: `Check out this discussion on TheOpenDissent!`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("share failed:", err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("clipboard write failed:", err);
      }
    }
  }, []);

  return { sharePost };
};
