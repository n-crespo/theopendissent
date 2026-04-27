import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Post } from "../../types";
import { subscribeToSubReplies } from "../../lib/firebase";
import { FeedItem } from "./FeedItem";

const PAGE_SIZE = 3;

interface SubReplyThreadProps {
  rootPostId: string;
  /** The reply this thread hangs off — provides id, hasSubReply, userId */
  parentReply: Post;
}

/**
 * Inline expand/collapse thread of sub-replies for a given reply.
 * Rendered immediately below the parent reply's FeedItem in PostDetails.
 *
 * Layout when expanded:
 *   │  [sub-reply 1]
 *   │  [sub-reply 2]
 *   │  [+ Load more]
 *      [↑ Collapse]
 *
 * The vertical line (│) collapses the thread on click.
 * A text "Collapse" button at the bottom also collapses.
 */
export const SubReplyThread = ({
  rootPostId,
  parentReply,
}: SubReplyThreadProps) => {
  const [expanded, setExpanded] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [subReplies, setSubReplies] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const collapse = () => {
    setExpanded(false);
    setSubReplies([]);
    setLimit(PAGE_SIZE);
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

  // nothing to show and nothing expanded
  if (!parentReply.hasSubReply && !expanded) return null;

  return (
    <div>
      {/* Expand trigger — hidden once expanded */}
      <AnimatePresence>
        {!expanded && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(true)}
            className="flex items-center gap-x-1.5 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            <i className="bi bi-arrow-right-short text-base leading-none" />
            <span>Replies</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded thread */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="flex gap-x-2 pt-1 pb-2">
              {/* Vertical thread line — click to collapse */}
              <button
                onClick={collapse}
                title="Collapse replies"
                className="w-5 flex-shrink-0 flex justify-center group px-1"
              >
                <div className="w-0.5 bg-slate-200 rounded-full h-full group-hover:bg-slate-400 transition-colors" />
              </button>

              {/* Sub-reply list */}
              <div className="flex-1 flex flex-col gap-y-2 min-w-0">
                {/* Loading skeleton */}
                {loading && subReplies.length === 0 && (
                  <div className="h-16 bg-slate-50 rounded-xl animate-pulse" />
                )}

                {subReplies.map((sr) => (
                  <FeedItem
                    key={sr.id}
                    item={sr}
                    isReply={true}
                    threadAuthorUserId={parentReply.userId}
                  />
                ))}

                {/* Empty state (e.g. all sub-replies deleted while expanded) */}
                {!loading && subReplies.length === 0 && (
                  <p className="text-xs text-slate-300 px-2 py-1 italic">
                    No replies yet.
                  </p>
                )}

                <div className="flex items-center justify-between px-1 pt-1">
                  {/* Load more */}
                  {subReplies.length >= limit ? (
                    <button
                      onClick={() => setLimit((l) => l + PAGE_SIZE)}
                      className="flex items-center gap-x-1 text-xs font-semibold text-slate-400 hover:text-slate-600 py-1 transition-colors"
                    >
                      <i className="bi bi-plus text-sm" />
                      Load more
                    </button>
                  ) : (
                    <span />
                  )}

                  {/* Collapse */}
                  <button
                    onClick={collapse}
                    className="flex items-center gap-x-1 text-xs font-semibold text-slate-400 hover:text-slate-600 py-1 transition-colors"
                  >
                    <i className="bi bi-arrow-up text-xs" />
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
