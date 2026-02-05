import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingDots } from "../ui/LoadingDots";
import { FeedItem } from "./FeedItem";
import { Post } from "../../types";

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
  const bottomBoundaryRef = useRef<HTMLDivElement>(null);

  // --- Infinite Scroll Logic ---
  useEffect(() => {
    const currentRef = bottomBoundaryRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        // Trigger load if visible, not loading, and more exists
        if (entry.isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "200px", // Increased for a smoother "seamless" feel
      },
    );

    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [hasMore, loading, onLoadMore]);

  // --- Render Helpers ---
  const renderItem = (post: Post, isHighlighted = false) => (
    <motion.div
      layout
      key={isHighlighted ? `highlighted-${post.id}` : post.id}
      initial={{
        opacity: 0,
        y: isHighlighted ? -20 : 20,
        scale: isHighlighted ? 0.95 : 1,
      }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{
        duration: 0.4,
        type: "spring",
        bounce: isHighlighted ? 0.3 : 0,
      }}
    >
      <FeedItem
        item={post}
        highlighted={isHighlighted}
        isReply={!!post.parentPostId} // Auto-detect if it's a reply
      />
    </motion.div>
  );

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto gap-4">
      <AnimatePresence mode="popLayout">
        {/* Priority/Highlighted Post */}
        {highlightedPost && renderItem(highlightedPost, true)}

        {/* Standard Feed List */}
        {posts.map((post) => renderItem(post))}
      </AnimatePresence>

      {/* Infinite Scroll Anchor & Loading States */}
      <div
        ref={bottomBoundaryRef}
        className="py-12 flex flex-col items-center justify-center w-full min-h-25"
      >
        {loading && hasMore ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 text-slate-400 text-sm font-semibold"
          >
            <LoadingDots />
            <span>Finding more perspectives...</span>
          </motion.div>
        ) : (
          !hasMore &&
          posts.length > 0 && (
            <div className="flex flex-col items-center gap-2 opacity-40">
              <div className="h-px w-12 bg-slate-300 mb-2" />
              <span className="text-slate-500 text-[11px] font-bold tracking-widest">
                You've reached the end!
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
};
