import { useState, useEffect } from "react";
import { subscribeToUserCounts, UserCounts } from "../lib/firebase";

export const useUserCounts = (userId: string | undefined) => {
  const [counts, setCounts] = useState<UserCounts>({
    posts: 0,
    replies: 0,
    agreed: 0,
    dissented: 0,
  });

  useEffect(() => {
    if (!userId) {
      setCounts({ posts: 0, replies: 0, agreed: 0, dissented: 0 });
      return;
    }

    // The subscription function returns the cleanup function directly
    const unsubscribe = subscribeToUserCounts(userId, (newCounts) => {
      setCounts(newCounts);
    });

    return () => unsubscribe();
  }, [userId]);

  return counts;
};
