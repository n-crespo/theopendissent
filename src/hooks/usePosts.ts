import { useState, useEffect } from "react";
import { subscribeToFeed } from "../lib/firebase";
import { Post } from "../types";
import { SortOption } from "../context/FeedSortContext";

// module level cache
const weightMap = new Map<string, number>();
const pinnedPostIds = new Set<string>();
let cachedLimit = 20;
let cachedPosts: Post[] = [];
let firebasePostsRef: Post[] = [];

// listeners to force re-render when a post is manually pinned
const pinListeners = new Set<() => void>();

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
  pinnedPostIds.add(postId);
  pinListeners.forEach((listener) => listener());
};

export const clearPinnedPosts = () => {
  pinnedPostIds.clear();
};

/**
 * manages real-time feed subscriptions and integrates sorting logic.
 */
export const usePosts = (initialLimit: number = 20, sortType: SortOption) => {
  // initialize state with the cache.
  // ensures the Feed renders full-height immediately on mount.
  const [posts, setPosts] = useState<Post[]>(() => cachedPosts);

  const [currentLimit, setCurrentLimit] = useState(() =>
    Math.max(initialLimit, cachedLimit),
  );

  const [loading, setLoading] = useState(true);
  const [pinTrigger, setPinTrigger] = useState(0);

  // Sync limit cache
  useEffect(() => {
    cachedLimit = currentLimit;
  }, [currentLimit]);

  // Listen for manual pins
  useEffect(() => {
    const listener = () => setPinTrigger((t) => t + 1);
    pinListeners.add(listener);
    return () => {
      pinListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    // ensure loading state is set when changing sort modes or increasing limits
    setLoading(true);

    const unsubscribe = subscribeToFeed(currentLimit, (postsArray) => {
      firebasePostsRef = postsArray;
      setPinTrigger((t) => t + 1); // trigger resort
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentLimit]);

  // Compute sorted posts whenever Firebase updates, sortType changes, or a post is pinned
  useEffect(() => {
    if (firebasePostsRef.length === 0) return;

    // split into pinned and regular
    const pinnedPosts = firebasePostsRef.filter((p) => pinnedPostIds.has(p.id));
    const regularPosts = firebasePostsRef.filter(
      (p) => !pinnedPostIds.has(p.id),
    );

    // apply random sort to regular posts if requested
    if (sortType === "random") {
      regularPosts.sort((a, b) => getPostWeight(a.id) - getPostWeight(b.id));
    }

    // pinned posts always stay exactly at the top
    const finalPosts = [...pinnedPosts, ...regularPosts];

    setPosts(finalPosts);
    cachedPosts = finalPosts;
  }, [pinTrigger, sortType]);

  const loadMore = () => {
    // Only load more if we aren't currently loading
    if (!loading) {
      setCurrentLimit((prev) => prev + 20);
    }
  };

  return { posts, loading, loadMore, currentLimit };
};
