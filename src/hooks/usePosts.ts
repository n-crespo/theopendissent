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
  const [currentLimit, setCurrentLimit] = useState(initialLimit);

  useEffect(() => {
    const postsRef = ref(db, "posts");
    const postsQuery = query(
      postsRef,
      orderByChild("timestamp"),
      limitToLast(currentLimit),
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

      setPosts(postsArray);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentLimit]); // re-run when limit changes

  const loadMore = () => {
    setLoading(true); // set loading to true while we fetch the next batch
    setCurrentLimit((prev) => prev + 20);
  };

  // return currentLimit so App.tsx can use it for the button logic
  return { posts, loading, loadMore, currentLimit };
};
