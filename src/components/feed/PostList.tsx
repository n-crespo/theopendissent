import { useState, useEffect } from "react";
import { usePosts } from "../../hooks/usePosts";
import { useFeedSort } from "../../context/FeedSortContext";
import { getPostById } from "../../lib/firebase";
import { Post } from "../../types";
import { PostListView } from "./PostListView";

/**
 * Smart container: Handles data fetching and deep-link logic for the main feed.
 */
export const PostList = () => {
  const { sortType } = useFeedSort();
  const { posts, loading, loadMore, currentLimit } = usePosts(20, sortType);
  const [injectedPost, setInjectedPost] = useState<Post | null>(null);

  useEffect(() => {
    // When sort changes, scroll to top of feed
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [sortType]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get("s");

    if (sharedId) {
      const fetchAndInject = async () => {
        const target = await getPostById(sharedId);
        if (!target) return;

        // If reply, fetch parent to inject into main feed
        if (target.parentPostId) {
          const parent = await getPostById(target.parentPostId);
          if (parent) setInjectedPost(parent);
        } else {
          setInjectedPost(target);
        }
      };
      fetchAndInject();
    }
  }, []);

  // Filter out the injected post from the main list to prevent duplicates
  const filteredPosts = injectedPost
    ? posts.filter((p) => p.id !== injectedPost.id)
    : posts;

  const hasMore = posts.length >= currentLimit;

  return (
    <PostListView
      posts={filteredPosts}
      highlightedPost={injectedPost}
      loading={loading}
      hasMore={hasMore}
      onLoadMore={loadMore}
    />
  );
};
