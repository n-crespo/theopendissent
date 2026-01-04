import { useState, useEffect, useRef } from "react";
import { getUserActivity, subscribeToPost } from "../lib/firebase";
import { Post } from "../types";

export const useUserActivity = (userId?: string, filter?: string) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Track subscriptions to avoid duplicates
  const subscriptions = useRef<Record<string, () => void>>({});

  useEffect(() => {
    if (!userId || !filter) return;

    let isMounted = true;
    setLoading(true);

    // 1. Initial Fetch
    getUserActivity(userId, filter as any).then((initialData) => {
      if (!isMounted) return;

      setPosts(initialData);
      setLoading(false);

      // 2. "Go Live" - Subscribe to every item found
      initialData.forEach((post) => {
        // Prevent duplicate subscriptions
        if (subscriptions.current[post.id]) return;

        // Subscribe to this specific item
        subscriptions.current[post.id] = subscribeToPost(
          post.id,
          (updatedPost) => {
            if (!updatedPost) {
              // CASE A: Item was deleted -> Remove from local state
              setPosts((prev) => prev.filter((p) => p.id !== post.id));
            } else {
              // CASE B: Item was edited -> Update local state
              // We merge (...p, ...updatedPost) to ensure we don't lose the
              // parentPost data that isn't included in the update stream.
              setPosts((prev) =>
                prev.map((p) =>
                  p.id === post.id ? { ...p, ...updatedPost } : p,
                ),
              );
            }
          },
          post.parentPostId,
        );
      });
    });

    // Cleanup: Unsubscribe when leaving or changing filter
    return () => {
      isMounted = false;
      Object.values(subscriptions.current).forEach((unsub) => unsub());
      subscriptions.current = {};
    };
  }, [userId, filter]);

  return { posts, loading };
};
