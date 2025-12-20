import { PostItem } from "./PostItem";
import { usePosts } from "../hooks/usePosts";

export const PostList = () => {
  // PostList now manages its own data requirements
  const { posts, loading, loadMore, currentLimit } = usePosts(20);
  const hasMore = posts.length >= currentLimit;

  return (
    <div id="post-list">
      {posts.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}

      {hasMore && (
        <button
          className="btn"
          onClick={loadMore}
          disabled={loading}
          style={{
            margin: "20px auto",
            display: "block",
            padding: "10px 20px",
            borderRadius: "var(--border-rad)",
            backgroundColor: "white",
            border: "1px solid var(--border-fg)",
          }}
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
};
