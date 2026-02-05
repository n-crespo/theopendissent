import { useState, useEffect } from "react";
import { subscribeToFeed } from "../lib/firebase";
import { Post } from "../types";
import { SortOption } from "../context/FeedSortContext";

// module-level cache to preserve shuffle order across session navigations
const weightMap = new Map<string, number>();

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLimit, setCurrentLimit] = useState(initialLimit);

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

      setPosts(finalPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentLimit, sortType]);

  const loadMore = () => {
    // guard to prevent multiple triggers while a fetch is active
    if (!loading) {
      setCurrentLimit((prev) => prev + 20);
    }
  };

  return { posts, loading, loadMore, currentLimit };
};
