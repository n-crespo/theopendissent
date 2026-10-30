import { useCallback } from "react";
import { Post } from "../types";
import { buildShareUrl } from "../lib/updateBuilders";
import { toast } from "../lib/toast";

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

/**
 * handles sharing logic and generates links for Social Previews.
 * resolves to what happened so the caller can confirm it in context
 * (e.g. a "Link copied" bubble on the share button); failures toast here.
 */
export const useShare = () => {
  const sharePost = useCallback(async (post: Post): Promise<ShareResult> => {
    const shareUrl = buildShareUrl(post, window.location.origin);

    const shareData = {
      title: "The Open Dissent",
      text: `Check out this discussion on TheOpenDissent!`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return "shared";
      } catch (err) {
        if ((err as Error).name === "AbortError") return "cancelled";
        console.error("share failed:", err);
      }
    }

    // no native share sheet, or it failed: fall back to the clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      return "copied";
    } catch (err) {
      console.error("clipboard write failed:", err);
      toast.error({
        title: "Couldn't copy the link",
        description: shareUrl,
        duration: 8000,
      });
      return "failed";
    }
  }, []);

  return { sharePost };
};
