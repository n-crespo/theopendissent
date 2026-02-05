import { useState, useEffect, useMemo } from "react";
import { usePosts } from "../../hooks/usePosts";
import { useFeedSort } from "../../context/FeedSortContext";
import { getPostById } from "../../lib/firebase";
import { Post } from "../../types";
import { FeedList } from "./FeedList";

/**
 * Smart container: Orchestrates data fetching, deep-linking, and sorting logic.
 */
export const FeedContainer = () => {
  const { sortType } = useFeedSort();
  const { posts, loading, loadMore, currentLimit } = usePosts(20, sortType);
  const [highlightedPost, setHighlightedPost] = useState<Post | null>(null);

  // reset scroll position when the user changes the sort order
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [sortType]);

  // handle deep-linking (e.g., /?s=post123)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get("s");

    if (sharedId) {
      const resolveSharedContent = async () => {
        const target = await getPostById(sharedId);
        if (!target) return;

        // if the link is for a reply, we want to highlight its parent post in the feed
        if (target.parentPostId) {
          const parent = await getPostById(target.parentPostId);
          if (parent) setHighlightedPost(parent);
        } else {
          setHighlightedPost(target);
        }
      };
      resolveSharedContent();
    }
  }, []);

  // prevent the highlighted post from appearing twice in the list
  const filteredPosts = useMemo(() => {
    if (!highlightedPost) return posts;
    return posts.filter((p) => p.id !== highlightedPost.id);
  }, [posts, highlightedPost]);

  const hasMore = posts.length >= currentLimit;

  return (
    <FeedList
      posts={filteredPosts}
      highlightedPost={highlightedPost}
      loading={loading}
      hasMore={hasMore}
      onLoadMore={loadMore}
    />
  );
};
