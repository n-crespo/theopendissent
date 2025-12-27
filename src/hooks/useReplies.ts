import { useState, useEffect } from "react";
import { ref, onValue, query, orderByChild } from "firebase/database";
import { db } from "../lib/firebase";
import { Post } from "../types";

/**
 * fetches all replies for a specific parent post.
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

    const repliesRef = ref(db, `replies/${parentId}`);
    const repliesQuery = query(repliesRef, orderByChild("timestamp"));

    const unsubscribe = onValue(repliesQuery, (snapshot) => {
      if (!snapshot.exists()) {
        setReplies([]);
        setLoading(false);
        return;
      }

      const data = snapshot.val();
      const repliesArray: Post[] = Object.entries(data)
        .map(([id, postData]: [string, any]) => ({
          id,
          ...postData,
          metrics: {
            agreedCount: postData.metrics?.agreedCount || 0,
            dissentedCount: postData.metrics?.dissentedCount || 0,
            replyCount: postData.metrics?.replyCount || 0,
          },
        }))
        // sort by timestamp ascending for conversation flow
        .sort(
          (a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0),
        );

      setReplies(repliesArray);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [parentId]);

  return { replies, loading };
};
