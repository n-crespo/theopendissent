import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Post } from "../../types";
import { subscribeToSubRepliesWithGap } from "../../lib/firebase";
import { FeedItem } from "./FeedItem";
import { useOutletContext, useNavigationType } from "react-router-dom";

const PAGE_SIZE = 3;

let isInitialMount = true;

interface SubReplyThreadProps {
  parentPostId: string;
  parentReply: Post;
  targetSubReplyId?: string | null; // to highlight a subreply
  recentlyRepliedToId?: string | null;
  setRecentlyRepliedToId?: (id: string | null) => void;
  onReply: () => void;
}

/**
 * Inline expand/collapse thread of sub-replies for a given reply.
 * Rendered immediately below the parent reply's FeedItem in PostDetails.
 */
export const SubReplyThread = ({
  parentPostId,
  parentReply,
  targetSubReplyId,
  onReply,
}: SubReplyThreadProps) => {
  // Grab the global target from Layout context
  const { activeTarget, setActiveTarget }: any = useOutletContext();
  const navType = useNavigationType();

  const [expanded, setExpanded] = useState(false);

  const shouldAnimateInitial = isInitialMount || navType !== "POP";

  useEffect(() => {
    isInitialMount = false;
  }, []);
  const [topLimit, setTopLimit] = useState(2);
  const [subReplies, setSubReplies] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [shouldScroll, setShouldScroll] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Determine the final ID we need to find/highlight
  // It's either the URL target or the fresh reply target (if the parent matches)
  const effectiveSubTargetId =
    targetSubReplyId ||
    (activeTarget?.parentId === parentReply.id ? activeTarget.id : null);

  // Trigger expansion and loading if a target exists
  useEffect(() => {
    if (effectiveSubTargetId) {
      setExpanded(true);
      setTopLimit(2);
      setShouldScroll(true);
    }
  }, [effectiveSubTargetId]);

  const collapse = () => setExpanded(false);

  // Execute scroll once data is loaded
  useEffect(() => {
    if (shouldScroll && subReplies.length > 0 && !loading) {
      setTimeout(() => {
        const targetEl = effectiveSubTargetId
          ? document.getElementById(`subreply-${effectiveSubTargetId}`)
          : null;

        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "center" });

          // clean up the URL only if we just satisfied a deep link
          if (targetSubReplyId) {
            setTimeout(() => {
              const newUrl = window.location.pathname;
              window.history.replaceState(null, "", newUrl);
            }, 1000);
          }

          // If this was a fresh reply, clear the global state
          if (activeTarget && setActiveTarget) {
            setActiveTarget(null);
          }
        } else if (!effectiveSubTargetId) {
          // Default scroll to bottom if no target is specified
          bottomRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 400);
      setShouldScroll(false);
    }
  }, [
    shouldScroll,
    subReplies.length,
    loading,
    effectiveSubTargetId,
    targetSubReplyId,
    activeTarget,
    setActiveTarget,
  ]);

  useEffect(() => {
    if (!expanded) return;
    setLoading(true);
    const unsub = subscribeToSubRepliesWithGap(
      parentPostId,
      parentReply.id,
      topLimit,
      (replies) => {
        setSubReplies(replies);
        setLoading(false);
      },
      effectiveSubTargetId,
    );

    return unsub;
  }, [expanded, topLimit, parentPostId, parentReply.id, effectiveSubTargetId]);

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
        className="flex items-center gap-x-1.5 px-4 py-2 text-base font-semibold text-slate-400 hover:text-slate-600 transition-colors"
      >
        {isInitialLoading ? (
          <>
            <i className="bi bi-arrow-repeat animate-spin text-base leading-none" />
            <span>Loading...</span>
          </>
        ) : expanded ? (
          <>
            <i className="bi bi-arrow-down text-lg leading-none" />
            <span>Collapse Replies</span>
          </>
        ) : (
          <>
            <i className="bi bi-arrow-return-right text-lg leading-none" />
            <span>Expand replies ({totalReplies})</span>
          </>
        )}
      </button>

      {/* Expanded thread */}
      <AnimatePresence initial={shouldAnimateInitial}>
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
                <AnimatePresence initial={shouldAnimateInitial}>
                  {subReplies.map((sr, index) => {
                    // Check if this is the end of the top block (index = topLimit - 1)
                    const isEndOfTop = hasGap && index === topLimit - 1;
                    return (
                      // include ID here so document.getElementById can find it
                      <div
                        key={sr.id}
                        id={`subreply-${sr.id}`}
                        className="flex flex-col"
                      >
                        <motion.div
                          layout
                          initial={
                            shouldAnimateInitial ? { opacity: 0 } : false
                          }
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          <FeedItem
                            item={sr}
                            isReply={true}
                            // Pass the highlighted state
                            highlighted={sr.id === targetSubReplyId}
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
                    className="flex items-center gap-x-1 text-base font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <i className="bi bi-arrow-up text-lg" />
                    Collapse Replies
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
