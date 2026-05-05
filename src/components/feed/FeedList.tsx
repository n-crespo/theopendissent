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
  const isPop = navType === "POP";

  /**
   * Tracks which post IDs are already visible on screen.
   * Initialised with current posts so that back-navigation never re-animates.
   * Cleared when sortType changes so the new batch all slide in fresh.
   */
  const renderedIdsRef = useRef<Set<string>>(
    new Set(posts.map((p) => p.id)),
  );

  // Mark all currently rendered posts as "seen" after every render
  useEffect(() => {
    posts.forEach((p) => renderedIdsRef.current.add(p.id));
    if (highlightedPost) renderedIdsRef.current.add(highlightedPost.id);
  });

  // When sort changes, clear the seen-set so all new posts animate in fresh
  useEffect(() => {
    renderedIdsRef.current = new Set();
  }, [sortType]);

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
        Outer AnimatePresence with mode="wait" keys on sortType.
        When the sort changes, the entire feed fades out cleanly before
        the new shuffled batch fades in — no posts flying around.
      */}
      <AnimatePresence mode="wait">
        <motion.div
          key={sortType}
          className="flex flex-col gap-3 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
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
              initial={
                isPop || renderedIdsRef.current.has(highlightedPost.id)
                  ? false
                  : { opacity: 0, y: 12 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
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
            posts.map((post) => {
              // Only animate if this is not a back-navigation AND the post is new
              const shouldAnimate =
                !isPop && !renderedIdsRef.current.has(post.id);
              return (
                <motion.div
                  key={post.id}
                  id={`post-${post.id}`}
                  initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="w-full"
                >
                  <FeedItem item={post} isReply={!!post.parentPostId} />
                </motion.div>
              );
            })}
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
