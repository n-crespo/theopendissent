import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingDots } from "../ui/LoadingDots";
import { FeedItem } from "./FeedItem";
import { FeedItemSkeleton } from "../ui/FeedItemSkeleton";
import { Post } from "../../types";
import { useNavigationType } from "react-router-dom";
import { SortOption } from "../../context/FeedSortContext";

interface FeedListProps {
  posts: Post[];
  highlightedPost?: Post | null;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  sortType: SortOption;
}

export const FeedList = ({
  posts,
  highlightedPost,
  loading,
  hasMore,
  onLoadMore,
  sortType,
}: FeedListProps) => {
  const navType = useNavigationType();

  /**
   * True only on the very first render when we arrived via back-swipe (POP).
   * We skip all enter animations in that case to avoid the iOS flicker.
   * Cleared after mount so subsequent load-more posts animate normally.
   */
  const skipAnimationRef = useRef(navType === "POP");
  useEffect(() => {
    skipAnimationRef.current = false;
  }, []);

  const [showLoadingUI, setShowLoadingUI] = useState(false);

  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    if (loading) {
      id = setTimeout(() => setShowLoadingUI(true), 400);
    } else {
      setShowLoadingUI(false);
    }
    return () => clearTimeout(id);
  }, [loading]);

  const showSkeletons = loading && showLoadingUI && posts.length === 0;

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto gap-3 min-h-100">
      {/*
        Outer AnimatePresence keys on sortType.
        When sort changes, the whole feed slides out then the new batch slides in —
        matching the Profile page's tab-switching transition exactly.
      */}
      <AnimatePresence>
        <motion.div
          key={sortType}
          className="flex flex-col gap-3 w-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {showSkeletons && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map((i) => (
                <FeedItemSkeleton key={i} />
              ))}
            </div>
          )}

          {!showSkeletons && highlightedPost && (
            <motion.div
              key={`highlight-${highlightedPost.id}`}
              initial={skipAnimationRef.current ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="w-full"
            >
              <FeedItem
                item={highlightedPost}
                highlighted={true}
                isReply={!!highlightedPost.parentPostId}
              />
            </motion.div>
          )}

          {!showSkeletons &&
            posts.map((post) => (
              <motion.div
                key={post.id}
                id={`post-${post.id}`}
                /**
                 * initial is only evaluated when this element first mounts in the DOM.
                 * Re-renders never re-trigger it, so this is safe to always set.
                 * skipAnimationRef is only true on the first render after a POP navigation.
                 */
                initial={skipAnimationRef.current ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="w-full"
              >
                <FeedItem item={post} isReply={!!post.parentPostId} />
              </motion.div>
            ))}
        </motion.div>
      </AnimatePresence>

      {/* Load More / End indicator */}
      <div className="mt-2 flex flex-col items-center justify-center w-full min-h-24 pb-12">
        {loading && hasMore && posts.length > 0 ? (
          <div className="flex items-center gap-3 text-slate-400 text-sm font-semibold animate-in fade-in duration-500">
            <LoadingDots />
            <span className="tracking-tight">Finding more perspectives...</span>
          </div>
        ) : hasMore && posts.length > 0 ? (
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-2.5 rounded-full bg-white hover:bg-slate-50 font-semibold text-sm text-slate-400 cursor-pointer transition-all border border-slate-200 shadow-sm"
          >
            Load more posts
          </button>
        ) : (
          !hasMore &&
          posts.length > 0 && (
            <div className="flex flex-col items-center gap-2 py-8">
              <div className="h-px w-12 bg-slate-300 mb-2 opacity-40" />
              <span className="text-sm font-semibold text-logo-blue opacity-20">
                You've reached the end!
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
};
