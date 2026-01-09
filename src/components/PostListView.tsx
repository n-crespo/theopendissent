import { motion, AnimatePresence } from "framer-motion";
import { LoadingDots } from "./ui/LoadingDots";
import { PostItem } from "./PostItem";
import { Post } from "../types";

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
            // className=""
          >
            <PostItem post={highlightedPost} />
          </motion.div>
        )}

        {/* Standard List */}
        {posts.map((post) => (
          <motion.div
            layout
            key={post.id}
            // CHANGED: We use 'animate' instead of 'whileInView' to force visibility
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3 }}
          >
            <PostItem post={post} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Load More Button */}
      {hasMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button
            className="mx-auto my-8 block cursor-pointer border bg-white px-8 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md disabled:opacity-50"
            style={{
              borderRadius: "var(--radius-button)",
              borderColor: "var(--color-border-subtle)",
            }}
            onClick={onLoadMore}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <LoadingDots />
                <span>Loading...</span>
              </div>
            ) : (
              "Load More"
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
};
