import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingDots } from "../ui/LoadingDots";
import { FeedItem } from "./FeedItem";
import { FeedItemSkeleton } from "../ui/FeedItemSkeleton";
import { Post } from "../../types";
import { useInfiniteScroll } from "../../hooks/useInfininteScroll";

interface FeedListProps {
  posts: Post[];
  highlightedPost?: Post | null;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  sortKey: string;
}

export const FeedList = ({
  posts,
  highlightedPost,
  loading,
  hasMore,
  onLoadMore,
  sortKey,
}: FeedListProps) => {
  const bottomBoundaryRef = useInfiniteScroll({
    loading,
    hasMore,
    onLoadMore,
  });

  const [showLoadingUI, setShowLoadingUI] = useState(false);

  // Skeleton delay logic
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (loading) {
      timeoutId = setTimeout(() => setShowLoadingUI(true), 1000);
    } else {
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

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto gap-3 min-h-100">
      <AnimatePresence mode="wait">
        {loading && showLoadingUI && posts.length === 0 ? (
          <motion.div
            key="loading-skeletons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3"
          >
            {[1, 2, 3, 4].map((i) => (
              <FeedItemSkeleton key={i} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={sortKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col gap-3"
          >
            {highlightedPost && (
              <FeedItem
                item={highlightedPost}
                highlighted={true}
                isReply={!!highlightedPost.parentPostId}
              />
            )}
            {posts.map((post) => (
              <FeedItem
                key={post.id}
                item={post}
                isReply={!!post.parentPostId}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Boundary / Infinite Scroll Loader */}
      <div
        ref={bottomBoundaryRef}
        className="mt-6 flex flex-col items-center justify-center w-full min-h-24 pb-12"
      >
        {loading && hasMore && posts.length > 0 ? (
          <div className="flex items-center gap-3 text-slate-400 text-sm font-semibold animate-in fade-in duration-500">
            <LoadingDots />
            <span className="tracking-tight">Finding more perspectives...</span>
          </div>
        ) : (
          !hasMore &&
          posts.length > 0 && (
            <div className="flex flex-col items-center gap-2 opacity-40 py-8">
              <div className="h-px w-12 bg-slate-300 mb-2" />
              <span className="text-slate-500 text-[10px] font-bold tracking-wider uppercase">
                You've reached the end!
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
};
