import { Post } from "../types";
import { PostItem } from "./PostItem";

interface PostListProps {
  posts: Post[];
  loadMore: () => void;
  isLoading: boolean;
  hasMore: boolean;
}

export const PostList = ({
  posts,
  loadMore,
  isLoading,
  hasMore,
}: PostListProps) => {
  return (
    <div id="post-list">
      {posts.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}

      {hasMore && (
        <button
          className="btn"
          onClick={loadMore}
          disabled={isLoading}
          style={{ margin: "20px auto", display: "block" }}
        >
          {isLoading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
};
