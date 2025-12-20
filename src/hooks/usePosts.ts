import { useState, useEffect } from "react";
import { ref, onValue, DataSnapshot } from "firebase/database";
import { db } from "../lib/firebase";
import { Post } from "../types";

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const postsRef = ref(db, "posts");

    const unsubscribe = onValue(postsRef, (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const postsObject = snapshot.val();
      const postsArray: Post[] = Object.entries(postsObject)
        .map(([postId, postData]: [string, any]) => {
          // validation to ensure data integrity
          if (!postData || typeof postData.postContent !== "string")
            return null;

          return {
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
          };
        })
        .filter((post): post is Post => post !== null);

      setPosts(postsArray);
      setLoading(false);
    });

    // cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  return { posts, loading };
};
