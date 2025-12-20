import { useState, useEffect, useRef, useCallback } from "react";
import { PostItem } from "./PostItem";
import { Post } from "../types";
import { User } from "firebase/auth";
import { shuffleArray } from "../utils";

interface PostListProps {
  posts: Post[];
  currentUser: User | null;
  onRequireAuth: () => void;
  loadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export const PostList = ({
  posts,
  currentUser,
  onRequireAuth,
  loadMore,
  hasMore,
  isLoading,
}: PostListProps) => {
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const observer = useRef<IntersectionObserver | null>(null);

  // infinite scroll observer
  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });

      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, loadMore],
  );

  useEffect(() => {
    if (posts.length === 0) return;

    setOrderedIds((prevIds) => {
      const incomingIds = posts.map((p) => p.id);

      if (prevIds.length === 0) {
        return shuffleArray(incomingIds);
      }

      const newIds = incomingIds.filter((id) => !prevIds.includes(id));
      // append new (older) posts to the end for infinite scroll
      return [...prevIds, ...newIds];
    });
  }, [posts]);

  const postsMap = new Map(posts.map((p) => [p.id, p]));
  const finalPosts = orderedIds
    .filter((id) => postsMap.has(id))
    .map((id) => postsMap.get(id)!);

  if (posts.length === 0 && !isLoading) {
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

      {/* sentinel element for infinite scroll */}
      <div ref={lastElementRef} style={{ height: "40px", marginTop: "20px" }}>
        {isLoading && (
          <p style={{ textAlign: "center", color: "var(--gray)" }}>
            Loading more...
          </p>
        )}
      </div>
    </div>
  );
};
