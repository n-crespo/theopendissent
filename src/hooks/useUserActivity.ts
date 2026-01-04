import { useState, useEffect } from "react";
import { getUserActivity } from "../lib/firebase";
import { Post } from "../types";

export const useUserActivity = (
  userId: string | undefined,
  filter: "posts" | "replies" | "agreed" | "dissented",
) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setPosts([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    // fix: Clear previous data immediately to prevent UI flash
    setPosts([]);
    setLoading(true);

    getUserActivity(userId, filter)
      .then((data) => {
        if (isMounted) {
          setPosts(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId, filter]); // Dependencies trigger re-run on change

  return { posts, loading };
};
