import { useCallback } from "react";
import { Post } from "../types";

/**
 * handles sharing logic and generates links for Social Previews.
 */
export const useShare = () => {
  const sharePost = useCallback(async (post: Post) => {
    const url = new URL(window.location.origin);
    url.pathname = "/share";

    const { id, parentPostId, parentReplyId } = post;

    // logic: s = target content ID, p = direct parent, r = root thread post
    url.searchParams.set("s", id);

    if (parentReplyId && parentPostId) {
      // sub-reply case
      url.searchParams.set("p", parentReplyId);
      url.searchParams.set("r", parentPostId);
    } else if (parentPostId) {
      // standard reply case
      url.searchParams.set("p", parentPostId);
    }

    const shareUrl = url.toString();
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
