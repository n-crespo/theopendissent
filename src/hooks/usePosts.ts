import { useState, useEffect } from "react";
import { subscribeToFeed } from "../lib/firebase";
import { Post } from "../types";
import { SortOption } from "../context/FeedSortContext";

// MODULE-LEVEL CACHE (Preserves shuffle order across navigations)
const weightMap = new Map<string, number>();

const getPostWeight = (postId: string) => {
  if (!weightMap.has(postId)) {
    weightMap.set(postId, Math.random());
  }
  return weightMap.get(postId)!;
};

export const pinPostToTop = (postId: string) => {
  weightMap.set(postId, -1);
};

export const usePosts = (initialLimit: number = 20, sortType: SortOption) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLimit, setCurrentLimit] = useState(initialLimit);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToFeed(currentLimit, (postsArray) => {
      let finalPosts = postsArray;

      // Only apply shuffle if the sort type is 'random'
      // Otherwise, we accept the default chronological order from Firebase
      if (sortType === "random") {
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
  }, [currentLimit, sortType]);

  const loadMore = () => {
    setCurrentLimit((prev) => prev + 20);
  };

  return { posts, loading, loadMore, currentLimit };
};
