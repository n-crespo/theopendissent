import { useState, useEffect, useRef } from "react";
import { subscribeToFeed } from "../lib/firebase";
import { Post } from "../types";
import { SortOption } from "../context/FeedSortContext";

const INITIAL_CHUNK = 3; // N: first page size
const MORE_CHUNK = 2; // M: each subsequent load-more batch

// module level cache
const weightMap = new Map<string, number>();
let pinnedPosts: Post[] = [];
let cachedLimit = INITIAL_CHUNK;
let cachedPosts: Post[] = [];

// listeners to force re-render when a post is manually pinned
const pinListeners = new Set<() => void>();

const getPostWeight = (postId: string) => {
  if (!weightMap.has(postId)) {
    weightMap.set(postId, Math.random());
  }
  return weightMap.get(postId)!;
};

const shuffleChunk = (chunk: Post[]) =>
  [...chunk].sort((a, b) => getPostWeight(a.id) - getPostWeight(b.id));

/**
 * Forces a post to the top.
 * Use this for new posts created by the user to provide immediate feedback,
 * since the frozen feed window will ignore them.
 */
export const pinPostToTop = (post: Post) => {
  if (!pinnedPosts.find((p) => p.id === post.id)) {
    pinnedPosts = [post, ...pinnedPosts];
    pinListeners.forEach((listener) => listener());
  }
};

export const clearPinnedPosts = () => {
  pinnedPosts = [];
};

/**
 * Manages real-time feed subscriptions and integrates sorting logic.
 */
export const usePosts = (
  initialLimit: number = INITIAL_CHUNK,
  sortType: SortOption,
) => {
  const [posts, setPosts] = useState<Post[]>(() => cachedPosts);
  const [currentLimit, setCurrentLimit] = useState(() =>
    Math.max(initialLimit, cachedLimit),
  );
  const [loading, setLoading] = useState(true);
  const [pinTrigger, setPinTrigger] = useState(0);

  // Freeze the window: we only fetch posts created BEFORE the page was loaded.
  const sessionStartTime = useRef(Date.now()).current;

  /**
   * The stable ordered list of post IDs we have already positioned.
   * This is the source of truth for order — never reshuffled.
   */
  const stableOrderRef = useRef<string[]>(
    cachedPosts.map((p) => p.id),
  );

  /**
   * The last raw array returned by Firebase.
   */
  const firebaseMapRef = useRef<Map<string, Post>>(new Map());

  // Sync limit cache
  useEffect(() => {
    cachedLimit = currentLimit;
  }, [currentLimit]);

  // Listen for manual pins
  useEffect(() => {
    const listener = () => setPinTrigger((t) => t + 1);
    pinListeners.add(listener);
    return () => {
      pinListeners.delete(listener);
    };
  }, []);

  // Subscribe to Firebase.
  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeToFeed(
      currentLimit,
      sessionStartTime,
      (postsArray) => {
        const newMap = new Map<string, Post>();
        postsArray.forEach((p) => newMap.set(p.id, p));
        firebaseMapRef.current = newMap;

        const existingIds = new Set(stableOrderRef.current);
        const newPosts = postsArray.filter((p) => !existingIds.has(p.id));

        if (newPosts.length > 0) {
          // Because we use endAt(sessionStartTime), ANY unseen post must be
          // an OLDER post fetched via "Load more" (since new posts are excluded).
          // Therefore, we can safely just append them to the bottom!
          const sortedNew =
            sortType === "random" ? shuffleChunk(newPosts) : newPosts;
            
          stableOrderRef.current = [
            ...stableOrderRef.current,
            ...sortedNew.map((p) => p.id),
          ];
        }

        const orderedPosts = stableOrderRef.current
          .map((id) => firebaseMapRef.current.get(id))
          .filter((p): p is Post => p !== undefined);

        const finalPosts = [...pinnedPosts, ...orderedPosts];
        setPosts(finalPosts);
        cachedPosts = finalPosts;
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentLimit]); // eslint-disable-line react-hooks/exhaustive-deps

  // When sortType changes, reset everything and start fresh
  useEffect(() => {
    stableOrderRef.current = [];
    firebaseMapRef.current = new Map();
    setCurrentLimit(initialLimit);
  }, [sortType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle pin changes
  useEffect(() => {
    if (firebaseMapRef.current.size === 0 && stableOrderRef.current.length === 0) return;

    const orderedPosts = stableOrderRef.current
      .map((id) => firebaseMapRef.current.get(id))
      .filter((p): p is Post => p !== undefined);

    const finalPosts = [...pinnedPosts, ...orderedPosts];
    setPosts(finalPosts);
    cachedPosts = finalPosts;
  }, [pinTrigger]);

  const loadMore = () => {
    if (!loading) {
      setCurrentLimit((prev) => prev + MORE_CHUNK);
    }
  };

  // We have more posts to load if Firebase returned exactly how many we asked for
  // (if it returns fewer, we've hit the absolute bottom of the database)
  const hasMore = Array.from(firebaseMapRef.current.keys()).length >= currentLimit;

  return { posts, loading, loadMore, currentLimit, hasMore };
};
