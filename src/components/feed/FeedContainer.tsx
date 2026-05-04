import { useState, useEffect, useMemo, useCallback } from "react";
import { usePosts, clearPinnedPosts } from "../../hooks/usePosts";
import { useFeedSort } from "../../context/FeedSortContext";
import { getPostById } from "../../lib/firebase";
import { Post } from "../../types";
import { FeedList } from "./FeedList";
import { useOutletContext } from "react-router-dom";

/**
 * Smart container: Orchestrates data fetching, deep-linking, and sorting logic.
 */
export const FeedContainer = () => {
  const { sortType } = useFeedSort();
  const { posts, loading, loadMore, currentLimit } = usePosts(20, sortType);
  const [highlightedPost, setHighlightedPost] = useState<Post | null>(null);
  const { activeTarget, setActiveTarget }: any = useOutletContext();

  // handle auto-scrolling to newly created top-level posts
  useEffect(() => {
    if (activeTarget && !activeTarget.parentId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`post-${activeTarget.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setActiveTarget(null);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [activeTarget, setActiveTarget]);

  // clear pinned posts when unmounting
  useEffect(() => {
    return () => clearPinnedPosts();
  }, []);

  // reset scroll position when the user changes the sort order
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [sortType]);

  // handle deep-linking (e.g., /?s=post123)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get("s");

    if (!sharedId) return;

    let isMounted = true;

    const resolveSharedContent = async () => {
      try {
        const target = await getPostById(sharedId);
        if (!target || !isMounted) return;

        // if the link is for a reply, highlight its parent post in the feed
        if (target.parentPostId) {
          const parent = await getPostById(target.parentPostId);
          if (parent && isMounted) setHighlightedPost(parent);
        } else if (isMounted) {
          setHighlightedPost(target);
        }
      } catch (error) {
        console.error("failed to resolve deep link:", error);
      }
    };

    resolveSharedContent();
    return () => {
      isMounted = false;
    };
  }, []);

  // memoize the load more callback to prevent unnecessary observer re-runs
  const handleLoadMore = useCallback(() => {
    if (!loading) {
      loadMore();
    }
  }, [loading, loadMore]);

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
      onLoadMore={handleLoadMore}
    />
  );
};
