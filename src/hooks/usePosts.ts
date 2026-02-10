import { useState, useEffect } from "react";
import { subscribeToFeed } from "../lib/firebase";
import { Post } from "../types";
import { SortOption } from "../context/FeedSortContext";

// module level cache
const weightMap = new Map<string, number>();
let cachedLimit = 20;
let cachedPosts: Post[] = [];

const getPostWeight = (postId: string) => {
  if (!weightMap.has(postId)) {
    weightMap.set(postId, Math.random());
  }
  return weightMap.get(postId)!;
};

/**
 * forces a post to the top by giving it the lowest possible weight.
 * use this for new posts created by the user to provide immediate feedback.
 */
export const pinPostToTop = (postId: string) => {
  weightMap.set(postId, -1);
};

/**
 * manages real-time feed subscriptions and integrates sorting logic.
 */
export const usePosts = (initialLimit: number = 20, sortType: SortOption) => {
  // initialize state with the cache.
  // ensures the Feed renders full-height immediately on mount.
  const [posts, setPosts] = useState<Post[]>(() => cachedPosts);

  // initialize limit from cache
  const [currentLimit, setCurrentLimit] = useState(() =>
    Math.max(initialLimit, cachedLimit),
  );

  const [loading, setLoading] = useState(true);

  // Sync limit cache
  useEffect(() => {
    cachedLimit = currentLimit;
  }, [currentLimit]);

  useEffect(() => {
    // ensure loading state is set when changing sort modes or increasing limits
    setLoading(true);

    const unsubscribe = subscribeToFeed(currentLimit, (postsArray) => {
      // create a shallow copy to avoid mutating the original array from firebase
      let finalPosts = [...postsArray];

      // apply random sort if requested; newest is already handled by subscribeToFeed
      if (sortType === "random") {
        finalPosts.sort((a, b) => getPostWeight(a.id) - getPostWeight(b.id));
      }

      // update state and cache
      setPosts(finalPosts);
      cachedPosts = finalPosts;

      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentLimit, sortType]);

  const loadMore = () => {
    // Only load more if we aren't currently loading
    if (!loading) {
      setCurrentLimit((prev) => prev + 20);
    }
  };

  return { posts, loading, loadMore, currentLimit };
};
