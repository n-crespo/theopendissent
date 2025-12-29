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
 * fetches top-level posts from the database with pagination support.
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
          // metrics object is gone; replyCount is now a direct field
          replyCount: postData.metrics?.replyCount || postData.replyCount || 0,
          userInteractions: {
            agreed: postData.userInteractions?.agreed || {},
            dissented: postData.userInteractions?.dissented || {},
          },
          parentPostId: postData.parentPostId,
        }))
        .filter((post) => post.postContent && !post.parentPostId)
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
