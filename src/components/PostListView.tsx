import { PostItem } from "./PostItem";
import { Post } from "../types";

interface PostListViewProps {
  posts: Post[];
  highlightedPost?: Post | null; // For the "injected" post logic
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
      {/* Priority/Highlighted Post (e.g. Deep links) */}
      {highlightedPost && (
        <PostItem
          key={`highlighted-${highlightedPost.id}`}
          post={highlightedPost}
        />
      )}

      {/* Standard List */}
      {posts.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}

      {/* Load More Button */}
      {hasMore && (
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
      )}
    </div>
  );
};
