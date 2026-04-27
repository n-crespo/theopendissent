import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Post } from "../../types";
import { subscribeToSubRepliesWithGap } from "../../lib/firebase";
import { FeedItem } from "./FeedItem";

const PAGE_SIZE = 3;

interface SubReplyThreadProps {
  rootPostId: string;
  parentReply: Post;
  recentlyRepliedToId?: string | null;
  setRecentlyRepliedToId?: (id: string | null) => void;
  onReply: () => void;
}

/**
 * Inline expand/collapse thread of sub-replies for a given reply.
 * Rendered immediately below the parent reply's FeedItem in PostDetails.
 */
export const SubReplyThread = ({
  rootPostId,
  parentReply,
  recentlyRepliedToId,
  setRecentlyRepliedToId,
  onReply,
}: SubReplyThreadProps) => {
  const [expanded, setExpanded] = useState(false);
  const [topLimit, setTopLimit] = useState(2);
  const [subReplies, setSubReplies] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [shouldScroll, setShouldScroll] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const collapse = () => {
    setExpanded(false);
    // Keep cached data so re-opening is instant and avoids height-jumps
  };

  // Auto-expand and scroll on new reply
  useEffect(() => {
    if (recentlyRepliedToId === parentReply.id) {
      setExpanded(true);
      setTopLimit(100); // Load all to avoid gaps when auto-scrolling to newest
      setShouldScroll(true);
    }
  }, [recentlyRepliedToId, parentReply.id]);

  // Execute scroll once data is loaded
  useEffect(() => {
    if (shouldScroll && subReplies.length > 0 && !loading) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        if (setRecentlyRepliedToId) setRecentlyRepliedToId(null);
      }, 400);
      setShouldScroll(false);
    }
  }, [shouldScroll, subReplies.length, loading, setRecentlyRepliedToId]);

  useEffect(() => {
    if (!expanded) return;
    setLoading(true);
    const unsub = subscribeToSubRepliesWithGap(
      rootPostId,
      parentReply.id,
      topLimit,
      (replies) => {
        setSubReplies(replies);
        setLoading(false);
      },
    );
    return unsub;
  }, [expanded, topLimit, rootPostId, parentReply.id]);

  const isInitialLoading = expanded && loading && subReplies.length === 0;

  const totalReplies = parentReply.replyCount || 0;
  if (totalReplies === 0 && !expanded) return null;

  // Gap exists if we haven't fetched all known replies
  const hasGap = subReplies.length < totalReplies;

  return (
    <div>
      {/* Thread toggle */}
      <button
        onClick={() => {
          if (expanded) collapse();
          else setExpanded(true);
        }}
        className="flex items-center gap-x-1.5 px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
      >
        {isInitialLoading ? (
          <>
            <i className="bi bi-arrow-repeat animate-spin text-base leading-none" />
            <span>Loading...</span>
          </>
        ) : expanded ? (
          <>
            <i className="bi bi-arrow-down text-base leading-none" />
            <span>Collapse</span>
          </>
        ) : (
          <>
            <i className="bi bi-arrow-return-right text-base leading-none" />
            <span>Replies</span>
          </>
        )}
      </button>

      {/* Expanded thread */}
      <AnimatePresence>
        {expanded && !isInitialLoading && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="flex gap-x-2 pt-1">
              {/* thread line (vertical bar). clicking collapses the thread. */}
              <button
                onClick={collapse}
                title="Collapse replies"
                className="w-6 shrink-0 relative group"
                style={{ minHeight: "2rem" }}
              >
                <div className="absolute left-1/2 -translate-x-1/2 top-1 bottom-4 w-0.5 bg-slate-200 group-hover:bg-slate-400 transition-colors rounded-full mb-7" />
              </button>

              {/* Sub-reply list */}
              <div className="flex-1 flex flex-col gap-y-2 min-w-0">
                <AnimatePresence>
                  {subReplies.map((sr, index) => {
                    // Check if this is the end of the top block (index = topLimit - 1)
                    const isEndOfTop = hasGap && index === topLimit - 1;
                    return (
                      <div key={sr.id} className="flex flex-col">
                        <motion.div
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          <FeedItem
                            item={sr}
                            isReply={true}
                            threadAuthorUserId={parentReply.userId}
                            onReply={onReply}
                          />
                        </motion.div>

                        {isEndOfTop && (
                          <div className="flex justify-center pt-2">
                            <button
                              onClick={() => setTopLimit((l) => l + PAGE_SIZE)}
                              className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-x-1.5 px-4 py-2 rounded-full"
                            >
                              <i className="bi bi-three-dots"></i>
                              Show {totalReplies - subReplies.length}{" "}
                              {totalReplies - subReplies.length === 1
                                ? "hidden reply"
                                : "hidden replies"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </AnimatePresence>

                {/* Empty state */}
                {!loading && subReplies.length === 0 && (
                  <p className="text-sm text-slate-300 px-2 py-1 italic">
                    No replies yet.
                  </p>
                )}

                <div ref={bottomRef} className="h-0 w-full" />

                {/* Bottom row: collapse (right) */}
                <div className="flex items-center justify-end px-1 -mt-1">
                  <button
                    onClick={collapse}
                    className="flex items-center gap-x-1 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <i className="bi bi-arrow-up text-sm" />
                    Collapse
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
