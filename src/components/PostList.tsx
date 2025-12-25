import { PostItem } from "./PostItem";
import { usePosts } from "../hooks/usePosts";

export const PostList = () => {
  // PostList now manages its own data requirements
  const { posts, loading, loadMore, currentLimit } = usePosts(20);
  const hasMore = posts.length >= currentLimit;

  return (
    <div className="flex flex-col">
      {posts.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}

      {hasMore && (
        <button
          className="mx-auto my-5 block cursor-pointer rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-custom shadow-sm transition-all hover:bg-logo-offwhite hover:shadow-md disabled:opacity-50"
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
