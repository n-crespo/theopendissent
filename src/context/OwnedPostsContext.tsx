import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";

const OwnedPostsContext = createContext<Set<string>>(new Set());

export const OwnedPostsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setOwnedIds(new Set());
      return;
    }

    const postsRef = ref(db, `users/${user.uid}/posts`);
    const repliesRef = ref(db, `users/${user.uid}/replies`);
    const subRepliesRef = ref(db, `users/${user.uid}/subreplies`);

    let currentPosts: string[] = [];
    let currentReplies: string[] = [];
    let currentSubReplies: string[] = [];

    const updateSet = () => {
      setOwnedIds(new Set([...currentPosts, ...currentReplies, ...currentSubReplies]));
    };

    const postsUnsub = onValue(postsRef, (snap) => {
      const keys: string[] = [];
      snap.forEach((child) => {
        keys.push(child.key as string);
      });
      currentPosts = keys;
      updateSet();
    });

    const repliesUnsub = onValue(repliesRef, (snap) => {
      const keys: string[] = [];
      snap.forEach((parent) => {
        parent.forEach((child) => {
          keys.push(child.key as string);
        });
      });
      currentReplies = keys;
      updateSet();
    });

    // subreplies receipt is 3-level: postId → replyId → subReplyId
    const subRepliesUnsub = onValue(subRepliesRef, (snap) => {
      const keys: string[] = [];
      snap.forEach((postGroup) => {
        postGroup.forEach((replyGroup) => {
          replyGroup.forEach((child) => {
            keys.push(child.key as string);
          });
        });
      });
      currentSubReplies = keys;
      updateSet();
    });

    return () => {
      postsUnsub();
      repliesUnsub();
      subRepliesUnsub();
    };
  }, [user]);

  return (
    <OwnedPostsContext.Provider value={ownedIds}>
      {children}
    </OwnedPostsContext.Provider>
  );
};

export const useOwnedPosts = () => useContext(OwnedPostsContext);
