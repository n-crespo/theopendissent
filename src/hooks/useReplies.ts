import { useState, useEffect } from "react";
import { subscribeToReplies } from "../lib/firebase";
import { Post } from "../types";

/**
 * manages the state of replies for a specific parent post.
 */
export const useReplies = (parentId: string | undefined) => {
  const [replies, setReplies] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!parentId) {
      setReplies([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToReplies(parentId, (repliesArray) => {
      setReplies(repliesArray);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [parentId]);

  return { replies, loading };
};
