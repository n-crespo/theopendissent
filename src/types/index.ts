export interface PostMetrics {
  agreedCount: number;
  dissentedCount: number;
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
  metrics: {
    agreedCount: number;
    dissentedCount: number;
  };
  userInteractions: {
    agreed: Record<string, boolean>;
    dissented: Record<string, boolean>;
  };
  parentPostId?: string;
  replyIds?: Record<string, boolean>;
}

export interface UserInteractions {
  agreed: Record<string, boolean>;
  dissented: Record<string, boolean>;
}

// this matches the user profile created by your cloud function
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}
