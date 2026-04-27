import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Post } from "../../types";
import { subscribeToSubReplies } from "../../lib/firebase";
import { FeedItem } from "./FeedItem";

const PAGE_SIZE = 3;

interface SubReplyThreadProps {
  rootPostId: string;
  parentReply: Post;
  onReply: () => void;
}

/**
 * Inline expand/collapse thread of sub-replies for a given reply.
 * Rendered immediately below the parent reply's FeedItem in PostDetails.
 *
 * Collapse methods:
 *  1. Click the vertical thread line on the left
 *  2. "Collapse" button at the top-right of the thread
 *  3. "Collapse" button at the bottom-right of the thread
 */
export const SubReplyThread = ({
  rootPostId,
  parentReply,
  onReply,
}: SubReplyThreadProps) => {
  const [expanded, setExpanded] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [subReplies, setSubReplies] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const collapse = () => {
    setExpanded(false);
    // Keep cached data so re-opening is instant and avoids height-jumps
    // setSubReplies([]);
    // setLimit(PAGE_SIZE);
  };

  useEffect(() => {
    if (!expanded) return;
    setLoading(true);
    const unsub = subscribeToSubReplies(
      rootPostId,
      parentReply.id,
      limit,
      (replies) => {
        setSubReplies(replies);
        setLoading(false);
      },
    );
    return unsub;
  }, [expanded, limit, rootPostId, parentReply.id]);

  const isInitialLoading = expanded && loading && subReplies.length === 0;

  if (!parentReply.hasSubReply && !expanded) return null;

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
            <i className="bi bi-arrow-repeat animate-spin leading-none" />
            <span>Loading...</span>
          </>
        ) : expanded ? (
          <>
            <i className="bi bi-arrow-down-short leading-none" />
            <span>Collapse</span>
          </>
        ) : (
          <>
            <i className="bi bi-arrow-right-short leading-none" />
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
            <div className="flex gap-x-1 pt-1 pb-2">
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
                  {subReplies.map((sr) => (
                    <motion.div
                      key={sr.id}
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
                  ))}
                </AnimatePresence>

                {/* Empty state */}
                {!loading && subReplies.length === 0 && (
                  <p className="text-xs text-slate-300 px-2 py-1 italic">
                    No replies yet.
                  </p>
                )}

                {/* Bottom row: load more (left) + collapse (right) */}
                <div className="flex items-center justify-between px-1 pt-1">
                  {subReplies.length >= limit ? (
                    <button
                      onClick={() => setLimit((l) => l + PAGE_SIZE)}
                      className="flex items-center gap-x-1 text-sm font-semibold text-slate-400 hover:text-slate-600 py-1 transition-colors"
                    >
                      <i className="bi bi-plus text-sm" />
                      Load more
                    </button>
                  ) : (
                    <span />
                  )}

                  <button
                    onClick={collapse}
                    className="flex items-center gap-x-1 text-sm font-semibold text-slate-400 hover:text-slate-600 py-1 transition-colors"
                  >
                    <i className="bi bi-arrow-up-short text-xs" />
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
