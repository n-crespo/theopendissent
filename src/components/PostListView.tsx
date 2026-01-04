import { motion, AnimatePresence } from "framer-motion";
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
            className="mb-4 border-b-4 border-logo-blue/10 pb-4"
          >
            <div className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-logo-blue">
              Highlight
            </div>
            <PostItem post={highlightedPost} />
          </motion.div>
        )}

        {/* Standard List */}
        {posts.map((post, index) => {
          // Indexes 0-3 animate immediately so the page is never empty.
          // Index 4+ wait for the scroll event.
          const isAboveFold = index < 4;

          return (
            <motion.div
              layout
              key={post.id}
              initial={{ opacity: 0, y: 40 }} // Start lower for a dramatic "rise"
              // Conditional Animation Trigger
              animate={isAboveFold ? { opacity: 1, y: 0 } : undefined}
              whileInView={!isAboveFold ? { opacity: 1, y: 0 } : undefined}
              // Trigger slightly before the element fully enters the screen
              viewport={{ once: true, margin: "0px 0px -100px 0px" }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <PostItem post={post} />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Load More Button */}
      {hasMore && (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
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
                <i className="bi bi-three-dots animate-pulse"></i>
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
