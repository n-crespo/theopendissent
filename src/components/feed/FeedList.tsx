import { useEffect, useState } from "react";
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

  const [showLoadingUI, setShowLoadingUI] = useState(false);

  // Skeleton delay logic
  useEffect(() => {
    let timeoutId: number;
    if (loading) {
      timeoutId = setTimeout(
        () => setShowLoadingUI(true),
        1000,
      ) as unknown as number;
    } else {
      setShowLoadingUI(false);
    }
    return () => clearTimeout(timeoutId);
  }, [loading]);

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto gap-3 min-h-100">
      <div className="flex flex-col gap-3 w-full">
        <AnimatePresence initial={shouldAnimateInitial}>
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
                initial={shouldAnimateInitial ? { opacity: 0, y: 12 } : false}
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
                initial={shouldAnimateInitial ? { opacity: 0, y: 12 } : false}
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

      {/* Manual Load More Button */}
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
            className="px-6 py-2.5 rounded-full bg-white hover:bg-slate-50 font-semibold text-sm text-slate-400 cursor-pointer transition-all border-slate-200 shadow-sm"
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
