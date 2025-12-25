export interface PostMetrics {
  agreedCount: number;
  dissentedCount: number;
  replyCount: number;
}

export interface PostInteractions {
  agreed: Record<string, boolean>;
  dissented: Record<string, boolean>;
}

export interface Post {
  id: string;
  userId: string;
  postContent: string;
  timestamp: number | object;
  editedAt?: number;
  metrics: PostMetrics;
  userInteractions: PostInteractions;
  parentPostId?: string;
  replyIds?: Record<string, boolean>;
  userInteractionType?: "agreed" | "dissented";
}

export interface UserInteractions {
  agreed: Record<string, boolean>;
  dissented: Record<string, boolean>;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}
