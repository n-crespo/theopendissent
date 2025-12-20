// src/types/index.ts

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
  metrics: PostMetrics;
  userInteractions: UserInteractions;

  // fields for handling replies
  parentPostId?: string; // present only if this post is a reply
  replyIds?: string[]; // list of IDs for posts that replied to this one
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
