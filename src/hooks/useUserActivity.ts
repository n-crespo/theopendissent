import { useState, useEffect, useRef } from "react";
import { getUserActivity, subscribeToPost } from "../lib/firebase";
import { Post } from "../types";

// module-level cache survives route changes but resets on page reload
const activityCache: Record<string, Post[]> = {};

type ActivityFilter = "posts" | "replies";

export const useUserActivity = (userId?: string, filter?: ActivityFilter) => {
  const cacheKey = userId && filter ? `${userId}-${filter}` : null;
  const [posts, setPosts] = useState<Post[]>(() =>
    cacheKey ? activityCache[cacheKey] || [] : [],
  );
  const [loading, setLoading] = useState(
    () => !(cacheKey && activityCache[cacheKey]?.length > 0),
  );
  const subscriptions = useRef<Record<string, () => void>>({});

  useEffect(() => {
    if (!userId || !filter || !cacheKey) return;
    let isMounted = true;

    if (!activityCache[cacheKey]) setLoading(true);

    const loadData = async () => {
      let combinedData: Post[] = [];

      if (filter === "replies") {
        // FETCH BOTH: replies AND subreplies in parallel
        const [standard, subs] = await Promise.all([
          getUserActivity(userId, "replies"),
          getUserActivity(userId, "subreplies"),
        ]);

        // Merge and sort chronologically
        combinedData = [...standard, ...subs].sort(
          (a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0),
        );
      } else {
        combinedData = await getUserActivity(userId, "posts");
      }

      if (!isMounted) return;

      setPosts(combinedData);
      activityCache[cacheKey] = combinedData;
      setLoading(false);

      // Subscribe to live updates for all items
      combinedData.forEach((post) => {
        if (subscriptions.current[post.id]) return;

        subscriptions.current[post.id] = subscribeToPost(
          post.id,
          (updatedPost) => {
            if (!isMounted) return;
            setPosts((prev) => {
              const newPosts = !updatedPost
                ? prev.filter((p) => p.id !== post.id)
                : prev.map((p) =>
                    p.id === post.id ? { ...p, ...updatedPost } : p,
                  );

              if (cacheKey) activityCache[cacheKey] = newPosts;
              return newPosts;
            });
          },
          post.parentPostId,
          post.parentReplyId, // Pass this to the updated subscribe function
        );
      });
    };
    loadData();

    return () => {
      isMounted = false;
      Object.values(subscriptions.current).forEach((unsub) => unsub());
      subscriptions.current = {};
    };
  }, [userId, filter, cacheKey]);

  return { posts, loading };
};
