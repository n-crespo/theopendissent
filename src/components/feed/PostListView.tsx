import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingDots } from "../ui/LoadingDots";
import { PostItem } from "./PostItem";
import { Post } from "../../types";

interface PostListViewProps {
  posts: Post[];
  highlightedPost?: Post | null;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export const PostListView = ({
  posts,
  highlightedPost,
  loading,
  hasMore,
  onLoadMore,
}: PostListViewProps) => {
  // a ref for the element at the bottom of the list
  const bottomBoundaryRef = useRef<HTMLDivElement>(null);

  // detect when the user scrolls to the bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        // load if the element is visible, we have more data, and we aren't already loading
        if (firstEntry.isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      {
        threshold: 0.1, // Trigger when even a tiny bit of the loading area is visible
        rootMargin: "100px", // Trigger 100px BEFORE user hits the bottom
      },
    );

    const currentRef = bottomBoundaryRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [hasMore, loading, onLoadMore]);

  return (
    <div className="flex flex-col">
      <AnimatePresence mode="popLayout">
        {/* Priority/Highlighted Post */}
        {highlightedPost && (
          <motion.div
            layout
            key={`highlighted-${highlightedPost.id}`}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
          >
            <PostItem post={highlightedPost} />
          </motion.div>
        )}

        {/* Standard List */}
        {posts.map((post) => (
          <motion.div
            layout
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3 }}
          >
            <PostItem post={post} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* when this scrolls into view observer fires */}
      <div
        ref={bottomBoundaryRef}
        className="py-8 flex flex-col items-center justify-center w-full min-h-12.5"
      >
        {loading && hasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-slate-400 text-sm font-medium"
          >
            <LoadingDots />
            <span>Loading older posts...</span>
          </motion.div>
        )}

        {!hasMore && posts.length > 0 && (
          <span className="text-slate-400 text-xs italic opacity-50">
            You've reached the end!
          </span>
        )}
      </div>
    </div>
  );
};
