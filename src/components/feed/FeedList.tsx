import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingDots } from "../ui/LoadingDots";
import { FeedItem } from "./FeedItem";
import { FeedItemSkeleton } from "../ui/FeedItemSkeleton";
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

  // New state to delay the skeleton visibility
  const [showLoadingUI, setShowLoadingUI] = useState(false);

  // --- Delay Logic ---
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (loading) {
      // If loading starts, wait 1000ms before showing the skeleton
      timeoutId = setTimeout(() => {
        setShowLoadingUI(true);
      }, 1000);
    } else {
      // If loading finishes, hide it immediately and clear any pending timer
      setShowLoadingUI(false);
    }

    return () => clearTimeout(timeoutId);
  }, [loading]);

  // --- Infinite Scroll Logic ---
  useEffect(() => {
    const currentRef = bottomBoundaryRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "400px" },
    );

    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [hasMore, loading, onLoadMore]);

  const renderItem = (post: Post, isHighlighted = false) => (
    <motion.div
      layout={isHighlighted ? "position" : undefined}
      key={isHighlighted ? `highlighted-${post.id}` : post.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <FeedItem
        item={post}
        highlighted={isHighlighted}
        isReply={!!post.parentPostId}
      />
    </motion.div>
  );

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto gap-3">
      {/* INITIAL LOAD SKELETONS
         Only show if:
         1. We have no posts (initial load)
         2. loading is TRUE (technically)
         3. showLoadingUI is TRUE (the 1s timer has passed)
      */}
      {loading && showLoadingUI && posts.length === 0 && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <FeedItemSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Render Posts */}
      <AnimatePresence initial={false}>
        {highlightedPost && renderItem(highlightedPost, true)}
        {posts.map((post) => renderItem(post))}
      </AnimatePresence>

      {/* Bottom Boundary / Infinite Scroll Loader */}
      <div
        ref={bottomBoundaryRef}
        className="mt-2 flex items-center justify-center w-full"
      >
        {/* We use standard 'loading' here so the user gets immediate feedback
            when they hit the bottom of the page, as delays feel laggy while scrolling. */}
        {loading && hasMore && posts.length > 0 ? (
          <div className="flex items-center gap-3 text-slate-400 text-sm font-semibold">
            <LoadingDots />
            <span>Finding more perspectives...</span>
          </div>
        ) : (
          !hasMore &&
          posts.length > 0 && (
            <div className="items-center opacity-40">
              <span className="text-slate-500 text-[11px] font-bold tracking-widest uppercase">
                You've reached the end!
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
};
