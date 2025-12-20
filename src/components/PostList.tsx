import { useState, useEffect } from "react";
import { PostItem } from "./PostItem";
import { Post } from "../types"; // we'll define types in a moment
import { User } from "firebase/auth";
import { shuffleArray } from "../utils";

interface PostListProps {
  posts: Post[];
  currentUser: User | null;
  onRequireAuth: () => void;
}

export const PostList = ({
  posts,
  currentUser,
  onRequireAuth,
}: PostListProps) => {
  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  useEffect(() => {
    if (posts.length === 0) return;

    setOrderedIds((prevIds) => {
      const incomingIds = posts.map((p) => p.id);

      // if this is the first load, shuffle the initial batch
      if (prevIds.length === 0) {
        return shuffleArray(incomingIds);
      }

      // add only new posts to the top (unshift), similar to your original logic
      const newIds = incomingIds.filter((id) => !prevIds.includes(id));
      return [...newIds, ...prevIds];
    });
  }, [posts]);

  // filter out IDs that might have been deleted from the DB
  const postsMap = new Map(posts.map((p) => [p.id, p]));
  const finalPosts = orderedIds
    .filter((id) => postsMap.has(id))
    .map((id) => postsMap.get(id)!);

  if (posts.length === 0) {
    return (
      <p style={{ textAlign: "center", marginTop: "20px" }}>No posts yet!</p>
    );
  }

  return (
    <div id="post-list">
      {finalPosts.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          currentUser={currentUser}
          onRequireAuth={onRequireAuth}
        />
      ))}
    </div>
  );
};
