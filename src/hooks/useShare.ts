import { useCallback } from "react";
import { Post } from "../types";
// import { useToast } from "../context/ToastContext";

/**
 * Custom hook to handle sharing logic.
 * Generates a deep link and invokes the native share sheet or clipboard fallback.
 */
export const useShare = () => {
  // const { showToast } = useToast();

  const sharePost = useCallback(async (post: Post) => {
    // Construct the Deep Link
    const url = new URL(window.location.origin);
    url.pathname = "/share";

    // Logic: If sharing a reply, 's' is the reply ID, 'p' is parent ID.
    // If sharing a main post, 's' is the post ID.
    url.searchParams.set("s", post.id);
    if (post.parentPostId) {
      url.searchParams.set("p", post.parentPostId);
    }

    const shareUrl = url.toString();
    // const shareText = `Check out this discussion on TheOpenDissent: "${post.postContent.substring(0, 50)}..."`;
    const shareText = `Check out this discussion on TheOpenDissent!`;

    const shareData = {
      title: "The Open Dissent",
      text: shareText,
      url: shareUrl,
    };

    // Native Share API (Mobile)
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // AbortError happens if user cancels the share sheet; we ignore it.
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    } else {
      // Desktop / Fallback (Clipboard)
      try {
        await navigator.clipboard.writeText(shareUrl);
        // showToast("Link copied to clipboard!");
        alert("Link copied to clipboard!"); // Temporary fallback
      } catch (err) {
        console.error("Clipboard write failed:", err);
      }
    }
  }, []);

  return { sharePost };
};
