// src/hooks/usePosts.ts
import { useState, useEffect } from "react";
import {
  ref,
  query,
  limitToLast,
  onValue,
  orderByChild,
} from "firebase/database";
import { db } from "../lib/firebase";
import { Post } from "../types";

export const usePosts = (initialLimit: number = 20) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [limitCount, setLimitCount] = useState(initialLimit);

  useEffect(() => {
    // query posts ordered by timestamp, limited to the most recent X
    const postsRef = ref(db, "posts");
    const postsQuery = query(
      postsRef,
      orderByChild("timestamp"),
      limitToLast(limitCount),
    );

    const unsubscribe = onValue(postsQuery, (snapshot) => {
      if (!snapshot.exists()) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const postsObject = snapshot.val();
      const postsArray: Post[] = Object.entries(postsObject)
        .map(([postId, postData]: [string, any]) => ({
          id: postId,
          userId: postData.userId,
          content: postData.postContent,
          timestamp: postData.timestamp || 0,
          metrics: postData.metrics || {
            agreedCount: 0,
            disagreedCount: 0,
            interestedCount: 0,
          },
          userInteractions: postData.userInteractions || {
            agreed: {},
            interested: {},
            disagreed: {},
          },
        }))
        .filter((post) => post.content !== undefined);

      // reverse so newest are at the top, or keep as is if your PostList handles order
      setPosts(postsArray);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [limitCount]);

  const loadMore = () => setLimitCount((prev) => prev + 20);

  return { posts, loading, loadMore };
};
