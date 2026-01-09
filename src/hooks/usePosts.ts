import { useState, useEffect, useRef } from "react";
import { subscribeToFeed } from "../lib/firebase";
import { Post } from "../types";

// MODULE-LEVEL CACHE
const weightMap = new Map<string, number>();

/**
 * Assigns a random weight (0 to 1) if one doesn't exist.
 */
const getPostWeight = (postId: string) => {
  if (!weightMap.has(postId)) {
    weightMap.set(postId, Math.random());
  }
  return weightMap.get(postId)!;
};

/**
 * Forces the weight of a post to -1 so its pinned at the top.
 */
export const pinPostToTop = (postId: string) => {
  weightMap.set(postId, -1);
};

export const usePosts = (initialLimit: number = 20) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLimit, setCurrentLimit] = useState(initialLimit);

  const isShuffleDisabled = useRef(
    import.meta.env.DEV && localStorage.getItem("disable_shuffle") === "true",
  ).current;

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToFeed(currentLimit, (postsArray) => {
      let finalPosts = postsArray;

      if (!isShuffleDisabled) {
        finalPosts = [...postsArray].sort((a, b) => {
          const weightA = getPostWeight(a.id);
          const weightB = getPostWeight(b.id);
          return weightA - weightB;
        });
      }

      setPosts(finalPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentLimit, isShuffleDisabled]);

  const loadMore = () => {
    setCurrentLimit((prev) => prev + 20);
  };

  return { posts, loading, loadMore, currentLimit };
};
