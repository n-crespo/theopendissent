import { PostItem } from "./PostItem";
import { usePosts } from "../hooks/usePosts";

/**
 * displays the main feed of top-level posts
 */
export const PostList = () => {
  // PostList now naturally manages only top-level data due to tree separation
  const { posts, loading, loadMore, currentLimit } = usePosts(20);
  const hasMore = posts.length >= currentLimit;

  return (
    <div className="flex flex-col">
      {posts.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}

      {hasMore && (
        <button
          className="mx-auto my-8 block cursor-pointer border bg-white px-8 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md disabled:opacity-50"
          style={{
            borderRadius: "var(--radius-button)",
            borderColor: "var(--color-border-subtle)",
          }}
          onClick={loadMore}
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
