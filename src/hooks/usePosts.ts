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

/**
 * Fetches top-level posts from the database with pagination support.
 */
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
          postContent: postData.postContent || postData.content,
          timestamp: postData.timestamp || 0,
          editedAt: postData.editedAt,
          metrics: {
            agreedCount: postData.metrics?.agreedCount || 0,
            dissentedCount:
              postData.metrics?.dissentedCount ||
              postData.metrics?.disagreedCount ||
              0,
            replyCount: postData.metrics?.replyCount || 0,
          },
          userInteractions: {
            agreed: postData.userInteractions?.agreed || {},
            dissented:
              postData.userInteractions?.dissented ||
              postData.userInteractions?.disagreed ||
              {},
          },
          replyIds: postData.replyIds || {},
          parentPostId: postData.parentPostId,
        }))
        // ensure we only display top-level posts in the main feed
        .filter((post) => post.postContent && !post.parentPostId)
        // sort newest first
        .sort(
          (a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0),
        );

      setPosts(postsArray);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentLimit]);

  const loadMore = () => {
    setLoading(true);
    setCurrentLimit((prev) => prev + 20);
  };

  return { posts, loading, loadMore, currentLimit };
};
