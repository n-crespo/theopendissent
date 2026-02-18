import { useState, useEffect, useRef } from "react";
import { getUserActivity, subscribeToPost } from "../lib/firebase";
import { Post } from "../types";

// module-level cache survives route changes but resets on page reload
const activityCache: Record<string, Post[]> = {};

type ActivityFilter = "posts" | "replies" | "interacted";

export const useUserActivity = (userId?: string, filter?: ActivityFilter) => {
  const cacheKey = userId && filter ? `${userId}-${filter}` : null;

  // initialize state directly from cache
  const [posts, setPosts] = useState<Post[]>(() => {
    if (cacheKey && activityCache[cacheKey]) {
      return activityCache[cacheKey];
    }
    return [];
  });

  // only set loading to true if we don't have cached data to show
  const [loading, setLoading] = useState(() => {
    if (
      cacheKey &&
      activityCache[cacheKey] &&
      activityCache[cacheKey].length > 0
    ) {
      return false;
    }
    return true;
  });

  // track subscriptions to avoid duplicates
  const subscriptions = useRef<Record<string, () => void>>({});

  useEffect(() => {
    if (!userId || !filter || !cacheKey) return;

    let isMounted = true;

    // only trigger loading spinner if cache was empty
    if (!activityCache[cacheKey]) {
      setLoading(true);
    }

    // Initial Fetch (Calls the updated getUserActivity with 'interacted')
    getUserActivity(userId, filter).then((initialData) => {
      if (!isMounted) return;

      // Update State AND Cache
      setPosts(initialData);
      activityCache[cacheKey] = initialData;
      setLoading(false);

      // "Go Live" - Subscribe to every item found
      initialData.forEach((post) => {
        // Prevent duplicate subscriptions
        if (subscriptions.current[post.id]) return;

        // Subscribe to this specific item
        // TODO: may need changing if we allow reply interaction
        subscriptions.current[post.id] = subscribeToPost(
          post.id,
          (updatedPost) => {
            if (!isMounted) return;

            setPosts((prev) => {
              let newPosts: Post[];

              if (!updatedPost) {
                // Item was deleted -> Remove from local state
                newPosts = prev.filter((p) => p.id !== post.id);
              } else {
                // Item was edited -> Update local state
                newPosts = prev.map((p) =>
                  p.id === post.id ? { ...p, ...updatedPost } : p,
                );
              }

              // CRITICAL: Keep cache in sync with live updates
              if (cacheKey) {
                activityCache[cacheKey] = newPosts;
              }

              return newPosts;
            });
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
  }, [userId, filter, cacheKey]);

  return { posts, loading };
};
