import { setInteraction } from "./firebase";

// A simple map of UserId -> Score
type InteractionState = Record<string, number>;

class InteractionStore {
  private state: Record<string, InteractionState> = {};
  private listeners: Record<string, Set<(state: InteractionState) => void>> =
    {};

  private pendingDebounce: Record<string, ReturnType<typeof setTimeout>> = {};

  // Timestamp until which we IGNORE server updates for a specific user/post combo
  private optimisticLocks: Record<string, number> = {};

  get(postId: string): InteractionState {
    return this.state[postId] || {};
  }

  subscribe(postId: string, callback: (state: InteractionState) => void) {
    if (!this.listeners[postId]) {
      this.listeners[postId] = new Set();
    }
    this.listeners[postId].add(callback);
    callback(this.get(postId));

    return () => {
      this.listeners[postId]?.delete(callback);
      if (this.listeners[postId]?.size === 0) {
        delete this.listeners[postId];
      }
    };
  }

  syncFromServer(
    postId: string,
    serverData: InteractionState,
    currentUid?: string,
  ) {
    const currentState = this.get(postId);
    const safeServerData = serverData || {};

    const lockKey = currentUid ? `${postId}-${currentUid}` : null;
    const isLocked =
      lockKey &&
      this.optimisticLocks[lockKey] &&
      Date.now() < this.optimisticLocks[lockKey];

    if (isLocked && currentUid) {
      // Locked: Accept others' data, preserve our own
      const mergedState = { ...safeServerData };
      const localScore = currentState[currentUid];

      if (localScore !== undefined) {
        mergedState[currentUid] = localScore;
      } else {
        delete mergedState[currentUid];
      }

      if (JSON.stringify(mergedState) !== JSON.stringify(currentState)) {
        this.state[postId] = mergedState;
        this.notify(postId);
      }
    } else {
      // Unlocked: Trust server
      if (JSON.stringify(safeServerData) !== JSON.stringify(currentState)) {
        this.state[postId] = safeServerData;
        this.notify(postId);
      }
    }
  }

  setScore(
    postId: string,
    uid: string,
    score: number | null | undefined,
    parentPostId?: string,
  ) {
    if (!this.state[postId]) this.state[postId] = {};

    const current = this.state[postId];
    const next = { ...current };

    // optimistic update (treat null and undefined as removal)
    if (score === null || score === undefined) {
      delete next[uid];
    } else {
      next[uid] = score;
    }

    this.state[postId] = next;
    this.notify(postId);

    // set lock (2 seconds)
    const lockKey = `${postId}-${uid}`;
    this.optimisticLocks[lockKey] = Date.now() + 2000;

    // debounce
    if (this.pendingDebounce[postId]) {
      clearTimeout(this.pendingDebounce[postId]);
    }

    this.pendingDebounce[postId] = setTimeout(() => {
      delete this.pendingDebounce[postId];
      // firebase setInteraction should handle null/undefined as a delete
      setInteraction(postId, uid, score, parentPostId).catch((err) =>
        console.error("Failed to sync interaction score:", err),
      );
    }, 500);
  }

  private notify(postId: string) {
    const data = this.get(postId);
    this.listeners[postId]?.forEach((cb) => cb(data));
  }
}

export const interactionStore = new InteractionStore();
