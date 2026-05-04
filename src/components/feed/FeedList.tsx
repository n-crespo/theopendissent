import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingDots } from "../ui/LoadingDots";
import { FeedItem } from "./FeedItem";
import { FeedItemSkeleton } from "../ui/FeedItemSkeleton";
import { Post } from "../../types";
import { useInfiniteScroll } from "../../hooks/useInfininteScroll";
import { useNavigationType } from "react-router-dom";

interface FeedListProps {
  posts: Post[];
  highlightedPost?: Post | null;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

let isInitialMount = true;

export const FeedList = ({
  posts,
  highlightedPost,
  loading,
  hasMore,
  onLoadMore,
}: FeedListProps) => {
  const navType = useNavigationType();
  const isPop = navType === "POP";

  // If this is the first time the app is loading, we want the premium fade-in.
  // If we are navigating back (POP), we skip it to prevent iOS jitter.
  const shouldAnimateInitial = isInitialMount || !isPop;

  useEffect(() => {
    isInitialMount = false;
  }, []);

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
      <div className="flex flex-col gap-3 w-full">
        <AnimatePresence mode="popLayout" initial={shouldAnimateInitial}>
          {loading && showLoadingUI && posts.length === 0 && (
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

          {!(loading && showLoadingUI && posts.length === 0) &&
            highlightedPost && (
              <motion.div
                layout
                key={`highlight-${highlightedPost.id}`}
                initial={{ opacity: 0, y: 12 }}
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

          {!(loading && showLoadingUI && posts.length === 0) &&
            posts.map((post) => (
              <motion.div
                layout
                key={post.id}
                id={`post-${post.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full"
              >
                <FeedItem item={post} isReply={!!post.parentPostId} />
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

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
