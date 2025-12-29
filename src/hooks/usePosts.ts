import { useState, useEffect } from "react";
import { subscribeToFeed } from "../lib/firebase";
import { Post } from "../types";

/**
 * manages top-level posts state and pagination.
 */
export const usePosts = (initialLimit: number = 20) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLimit, setCurrentLimit] = useState(initialLimit);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToFeed(currentLimit, (postsArray) => {
      setPosts(postsArray);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentLimit]);

  const loadMore = () => {
    setCurrentLimit((prev) => prev + 20);
  };

  return { posts, loading, loadMore, currentLimit };
};
