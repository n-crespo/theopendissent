import { useState, useEffect, useRef } from "react";
import { subscribeToFeed } from "../lib/firebase";
import { Post } from "../types";
import { SortOption } from "../context/FeedSortContext";

// Chunk sizes — keep small for testing
export const INITIAL_CHUNK = 3; // N: posts loaded on first page load
export const MORE_CHUNK = 2;    // M: posts added per "Load more" click

// ─── Module-level singletons ─────────────────────────────────────────────────
const weightMap = new Map<string, number>();
let pinnedPosts: Post[] = [];
const pinListeners = new Set<() => void>();

/**
 * Frozen at module load time. All Firebase queries use endAt(sessionStartTime)
 * so the feed window never shifts forward while the user is reading.
 */
const sessionStartTime = Date.now();

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

/**
 * This hook is called from Layout (App.tsx) which is ALWAYS mounted.
 * It therefore never loses state during route navigation.
 */
export const usePosts = (sortType: SortOption) => {
  const [currentLimit, setCurrentLimit] = useState(INITIAL_CHUNK);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinTrigger, setPinTrigger] = useState(0);

  /**
   * resetKey increments on sort change, forcing the subscription effect to
   * re-run even when currentLimit hasn't changed value.
   */
  const [resetKey, setResetKey] = useState(0);

  /**
   * Ordered list of post IDs that have been positioned in the feed.
   * Never reshuffled — this is the single source of truth for display order.
   */
  const stableOrderRef = useRef<string[]>([]);

  /** Latest snapshot from Firebase, keyed by post ID. */
  const firebaseMapRef = useRef<Map<string, Post>>(new Map());

  /**
   * Prevents the sortType effect from wiping state on initial mount.
   * On initial mount we just mark as mounted; subsequent changes trigger reset.
   */
  const isMountedRef = useRef(false);

  // ── Pin listeners ─────────────────────────────────────────────────────────
  useEffect(() => {
    const listener = () => setPinTrigger((t) => t + 1);
    pinListeners.add(listener);
    return () => { pinListeners.delete(listener); };
  }, []);

  // ── Sort change: wipe and restart ─────────────────────────────────────────
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    stableOrderRef.current = [];
    firebaseMapRef.current = new Map();
    setPosts([]);
    setCurrentLimit(INITIAL_CHUNK);
    setResetKey((k) => k + 1);
  }, [sortType]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Main Firebase subscription ────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeToFeed(
      currentLimit,
      sessionStartTime,
      (postsArray: Post[]) => {
        const newMap = new Map<string, Post>();
        postsArray.forEach((p: Post) => newMap.set(p.id, p));
        firebaseMapRef.current = newMap;

        // Find posts not yet assigned a position
        const existingIds = new Set(stableOrderRef.current);
        const newPosts = postsArray.filter((p: Post) => !existingIds.has(p.id));

        if (newPosts.length > 0) {
          // endAt(sessionStartTime) guarantees all unseen posts are strictly
          // older than everything already displayed → always append to bottom.
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

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const rebuild = () => {
    const orderedPosts = stableOrderRef.current
      .map((id) => firebaseMapRef.current.get(id))
      .filter((p): p is Post => p !== undefined);
    setPosts([...pinnedPosts, ...orderedPosts]);
  };

  const loadMore = () => {
    if (!loading) setCurrentLimit((prev) => prev + MORE_CHUNK);
  };

  const hasMore = firebaseMapRef.current.size >= currentLimit;

  return { posts, loading, loadMore, hasMore };
};
