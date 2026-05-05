import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingDots } from "../ui/LoadingDots";
import { FeedItem } from "./FeedItem";
import { FeedItemSkeleton } from "../ui/FeedItemSkeleton";
import { Post } from "../../types";
import { useNavigationType } from "react-router-dom";

interface FeedListProps {
  posts: Post[];
  highlightedPost?: Post | null;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export const FeedList = ({
  posts,
  highlightedPost,
  loading,
  hasMore,
  onLoadMore,
}: FeedListProps) => {
  const navType = useNavigationType();

  /**
   * On back-navigation (POP), skip all enter animations to avoid the flicker
   * caused by motion.div re-animating every post when the component remounts.
   */
  const isPop = navType === "POP";

  /**
   * Tracks which post IDs are already rendered on screen.
   *
   * Initialized with the IDs of the posts that come in on mount.
   * Because usePosts initializes from a module-level cache, on a back-navigation
   * these will already be the full set of previously loaded posts — so they
   * correctly get initial={false} and don't re-animate.
   *
   * Any post ID NOT in this set is genuinely new (initial chunk load, load-more,
   * or a pinned user post) and will animate in.
   */
  const renderedIdsRef = useRef<Set<string>>(
    new Set(posts.map((p) => p.id)),
  );

  // After every render, mark all current posts as "seen"
  useEffect(() => {
    posts.forEach((p) => renderedIdsRef.current.add(p.id));
    if (highlightedPost) renderedIdsRef.current.add(highlightedPost.id);
  });

  const [showLoadingUI, setShowLoadingUI] = useState(false);

  // Only show skeleton after 400ms to avoid a flash on fast loads
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
      <div className="flex flex-col gap-3 w-full">
        <AnimatePresence>
          {showSkeletons && (
            <motion.div
              key="skeletons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              {[1, 2, 3, 4].map((i) => (
                <FeedItemSkeleton key={i} />
              ))}
            </motion.div>
          )}

          {!showSkeletons && highlightedPost && (
            <motion.div
              layout
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
              // Animate in only if: not a back-navigation AND genuinely new post
              const shouldAnimate =
                !isPop && !renderedIdsRef.current.has(post.id);
              return (
                <motion.div
                  layout
                  key={post.id}
                  id={`post-${post.id}`}
                  initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="w-full"
                >
                  <FeedItem item={post} isReply={!!post.parentPostId} />
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>

      {/* Load More / End indicator */}
      <div className="mt-6 flex flex-col items-center justify-center w-full min-h-24 pb-12">
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
            <div className="flex flex-col items-center gap-2 opacity-40 py-8">
              <div className="h-px w-12 bg-slate-300 mb-2" />
              <span className="text-sm font-semibold text-logo-blue opacity-30">
                You've reached the end!
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
};
