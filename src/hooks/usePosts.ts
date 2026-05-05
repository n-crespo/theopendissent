import { useState, useEffect, useRef } from "react";
import { subscribeToFeed } from "../lib/firebase";
import { Post } from "../types";
import { SortOption } from "../context/FeedSortContext";

// Chunk sizes — keep small for testing
export const INITIAL_CHUNK = 3; // N: posts loaded on first page load
export const MORE_CHUNK = 2;    // M: posts added per "Load more" click

// ─── Module-level session state ───────────────────────────────────────────────
// These survive component unmount/remount (e.g., navigating to PostDetails and back).
// They are reset to defaults on a full page reload.

/** Frozen at first module import — all Firebase queries use endAt(this). */
const sessionStartTime = Date.now();

const weightMap = new Map<string, number>();
let pinnedPosts: Post[] = [];
const pinListeners = new Set<() => void>();

// Feed persistence cache — keeps the feed state across navigations
let cache: {
  posts: Post[];
  stableOrder: string[];
  firebaseMap: Map<string, Post>;
  limit: number;
} = {
  posts: [],
  stableOrder: [],
  firebaseMap: new Map(),
  limit: INITIAL_CHUNK,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getPostWeight = (postId: string): number => {
  if (!weightMap.has(postId)) weightMap.set(postId, Math.random());
  return weightMap.get(postId)!;
};

const shuffleChunk = (chunk: Post[]): Post[] =>
  [...chunk].sort((a, b) => getPostWeight(a.id) - getPostWeight(b.id));

/**
 * Pins a user-created post to the top of the feed.
 * The frozen Firebase window excludes posts created after page load,
 * so we inject the user's own new posts manually here.
 */
export const pinPostToTop = (post: Post): void => {
  if (!pinnedPosts.find((p) => p.id === post.id)) {
    pinnedPosts = [post, ...pinnedPosts];
    pinListeners.forEach((l) => l());
  }
};

export const clearPinnedPosts = (): void => {
  pinnedPosts = [];
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const usePosts = (sortType: SortOption) => {
  // Initialize from cache — restores feed state when navigating back
  const [currentLimit, setCurrentLimit] = useState(cache.limit);
  const [posts, setPosts] = useState<Post[]>(cache.posts);
  const [loading, setLoading] = useState(cache.posts.length === 0);
  const [pinTrigger, setPinTrigger] = useState(0);

  /**
   * resetKey is incremented when sortType changes.
   * This forces the subscription effect to re-run even if currentLimit
   * didn't change (e.g., toggling sort while still at the initial chunk size).
   */
  const [resetKey, setResetKey] = useState(0);

  // Restore refs from module-level cache on mount
  const stableOrderRef = useRef<string[]>(cache.stableOrder);
  const firebaseMapRef = useRef<Map<string, Post>>(cache.firebaseMap);

  /**
   * Guards the sortType effect from firing on initial mount.
   * Without this, mounting after a navigation would immediately wipe the cache.
   */
  const isMountedRef = useRef(false);

  // ── Pin listeners ─────────────────────────────────────────────────────────
  useEffect(() => {
    const listener = () => setPinTrigger((t) => t + 1);
    pinListeners.add(listener);
    return () => { pinListeners.delete(listener); };
  }, []);

  // ── Sort change: wipe state and restart ───────────────────────────────────
  useEffect(() => {
    if (!isMountedRef.current) {
      // Skip on initial mount — we're restoring from cache, not changing sort
      isMountedRef.current = true;
      return;
    }
    // User explicitly changed the sort — full reset
    stableOrderRef.current = [];
    firebaseMapRef.current = new Map();
    cache = { posts: [], stableOrder: [], firebaseMap: new Map(), limit: INITIAL_CHUNK };
    setPosts([]);
    setCurrentLimit(INITIAL_CHUNK);
    setResetKey((k) => k + 1);
  }, [sortType]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Main Firebase subscription ────────────────────────────────────────────
  // Re-runs when limit increases (load more) OR resetKey changes (sort toggle).
  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeToFeed(
      currentLimit,
      sessionStartTime,
      (postsArray: Post[]) => {
        const newMap = new Map<string, Post>();
        postsArray.forEach((p: Post) => newMap.set(p.id, p));
        firebaseMapRef.current = newMap;

        const existingIds = new Set(stableOrderRef.current);
        const newPosts = postsArray.filter((p: Post) => !existingIds.has(p.id));

        if (newPosts.length > 0) {
          // All unseen posts are strictly older (endAt freezes the top),
          // so they are always appended to the bottom.
          const batch =
            sortType === "random" ? shuffleChunk(newPosts) : newPosts;

          stableOrderRef.current = [
            ...stableOrderRef.current,
            ...batch.map((p: Post) => p.id),
          ];
        }

        rebuild();
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentLimit, resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pin trigger ───────────────────────────────────────────────────────────
  useEffect(() => {
    rebuild();
  }, [pinTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const rebuild = () => {
    const orderedPosts = stableOrderRef.current
      .map((id) => firebaseMapRef.current.get(id))
      .filter((p): p is Post => p !== undefined);
    const finalPosts = [...pinnedPosts, ...orderedPosts];

    // Sync module-level cache so the next mount can restore from here
    cache = {
      posts: finalPosts,
      stableOrder: stableOrderRef.current,
      firebaseMap: firebaseMapRef.current,
      limit: currentLimit,
    };

    setPosts(finalPosts);
  };

  const loadMore = () => {
    if (!loading) setCurrentLimit((prev) => prev + MORE_CHUNK);
  };

  const hasMore = firebaseMapRef.current.size >= currentLimit;

  return { posts, loading, loadMore, hasMore };
};
