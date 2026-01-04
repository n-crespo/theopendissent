import { useState, useEffect } from "react";
import { getUserCounts } from "../lib/firebase";

export const useUserCounts = (userId: string | undefined) => {
  const [counts, setCounts] = useState({
    posts: 0,
    replies: 0,
    agreed: 0,
    dissented: 0,
  });

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    getUserCounts(userId).then((data) => {
      if (isMounted) setCounts(data);
    });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return counts;
};
