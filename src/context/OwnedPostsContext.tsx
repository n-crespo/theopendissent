import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
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

    const userPath = `users/${user.uid}`;
    const postsRef = ref(db, `${userPath}/posts`);
    const repliesRef = ref(db, `${userPath}/replies`);
    const subRepliesRef = ref(db, `${userPath}/subreplies`);

    let currentPosts: string[] = [];
    let currentReplies: string[] = [];
    let currentSubReplies: string[] = [];

    const updateSet = () => {
      setOwnedIds(
        new Set([...currentPosts, ...currentReplies, ...currentSubReplies]),
      );
    };

    // posts receipt is 1-level: postId -> true
    const postsUnsub = onValue(postsRef, (snap) => {
      const keys: string[] = [];
      snap.forEach((child) => {
        keys.push(child.key as string);
      });
      currentPosts = keys;
      updateSet();
    });

    // replies receipt is 2-level: parentId -> replyId -> true
    const repliesUnsub = onValue(repliesRef, (snap) => {
      const keys: string[] = [];
      snap.forEach((parentPostSnap) => {
        parentPostSnap.forEach((replySnap) => {
          keys.push(replySnap.key as string);
        });
      });
      currentReplies = keys;
      updateSet();
    });

    // subreplies receipt is 3-level: postId -> replyId -> subReplyId -> true
    const subRepliesUnsub = onValue(subRepliesRef, (snap) => {
      const keys: string[] = [];
      snap.forEach((postGroup) => {
        postGroup.forEach((replyGroup) => {
          replyGroup.forEach((subReplySnap) => {
            keys.push(subReplySnap.key as string);
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
