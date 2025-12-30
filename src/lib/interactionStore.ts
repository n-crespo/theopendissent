import { addInteraction, removeInteraction } from "./firebase";

type InteractionType = "agreed" | "dissented";
type Interactions = {
  agreed: Record<string, boolean>;
  dissented: Record<string, boolean>;
};

class InteractionStore {
  private state: Record<string, Interactions> = {};
  private listeners: Record<string, Set<(state: Interactions) => void>> = {};
  private pendingDebounce: Record<string, NodeJS.Timeout> = {};

  // Helper to ensure data structure is always complete
  private sanitize(data?: Partial<Interactions>): Interactions {
    return {
      agreed: data?.agreed || {},
      dissented: data?.dissented || {},
    };
  }

  get(postId: string): Interactions {
    return this.sanitize(this.state[postId]);
  }

  subscribe(postId: string, callback: (state: Interactions) => void) {
    if (!this.listeners[postId]) this.listeners[postId] = new Set();
    this.listeners[postId].add(callback);

    // Send immediate current state (sanitized)
    callback(this.get(postId));

    return () => {
      this.listeners[postId]?.delete(callback);
      if (this.listeners[postId]?.size === 0) delete this.listeners[postId];
    };
  }

  syncFromServer(postId: string, serverData: Interactions) {
    if (this.pendingDebounce[postId]) return; // Ignore server if user is interacting

    // Sanitize incoming server data to ensure both keys exist
    const safeData = this.sanitize(serverData);

    if (JSON.stringify(safeData) !== JSON.stringify(this.state[postId])) {
      this.state[postId] = safeData;
      this.notify(postId);
    }
  }

  async toggle(
    postId: string,
    uid: string,
    type: InteractionType,
    parentPostId?: string,
  ) {
    // 1. Initialize safe state if missing
    if (!this.state[postId]) {
      this.state[postId] = { agreed: {}, dissented: {} };
    }

    // Ensure strict structure before accessing
    const current = this.state[postId];
    if (!current.agreed) current.agreed = {};
    if (!current.dissented) current.dissented = {};

    const otherType = type === "agreed" ? "dissented" : "agreed";

    // SAFE ACCESS: Now guaranteed to exist
    const wasActive = !!current[type][uid];
    const wasOtherActive = !!current[otherType][uid];

    // 2. Optimistic Update (In Memory)
    const next = {
      agreed: { ...current.agreed },
      dissented: { ...current.dissented },
    };

    if (wasActive) {
      delete next[type][uid];
    } else {
      next[type][uid] = true;
      if (wasOtherActive) delete next[otherType][uid];
    }

    this.state[postId] = next;
    this.notify(postId);

    // 3. Debounced Server Call
    if (this.pendingDebounce[postId])
      clearTimeout(this.pendingDebounce[postId]);

    this.pendingDebounce[postId] = setTimeout(async () => {
      delete this.pendingDebounce[postId];
      try {
        if (wasActive) {
          await removeInteraction(postId, uid, type, parentPostId);
        } else {
          await addInteraction(postId, uid, type, parentPostId);
          if (wasOtherActive)
            await removeInteraction(postId, uid, otherType, parentPostId);
        }
      } catch (err) {
        console.error("Interaction sync failed", err);
      }
    }, 1000);
  }

  private notify(postId: string) {
    const data = this.sanitize(this.state[postId]);
    this.listeners[postId]?.forEach((cb) => cb(data));
  }
}

export const interactionStore = new InteractionStore();
