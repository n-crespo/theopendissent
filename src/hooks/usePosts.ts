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
        .map(([postId, postData]: [string, any]) => {
          // handle legacy data: fall back to .postContent if .content exists
          const postContent = postData.postContent || postData.content;

          return {
            id: postId,
            userId: postData.userId,
            postContent: postContent, // mapped to match Post interface
            timestamp: postData.timestamp || 0,
            metrics: {
              agreedCount: postData.metrics?.agreedCount || 0,
              dissentedCount:
                postData.metrics?.dissentedCount ||
                postData.metrics?.disagreedCount ||
                0,
            },
            userInteractions: {
              agreed: postData.userInteractions?.agreed || {},
              dissented:
                postData.userInteractions?.dissented ||
                postData.userInteractions?.disagreed ||
                {},
            },
            parentPostId: postData.parentPostId,
            replyIds: postData.replyIds || {},
          };
        })
        .filter((post) => post.postContent !== undefined)
        // sort by timestamp descending (newest first)
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
