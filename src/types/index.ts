// src/types/index.ts

export interface PostMetrics {
  agreedCount: number;
  disagreedCount: number;
  interestedCount: number;
}

export interface PostInteractions {
  agreed: { [uid: string]: boolean };
  interested: { [uid: string]: boolean };
  disagreed: { [uid: string]: boolean };
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  timestamp: number | object;
  metrics: PostMetrics;
  userInteractions: PostInteractions;
}

export interface UserInteractions {
  hasAgreed: boolean;
  hasInterested: boolean;
  hasDisagreed: boolean;
}

// this matches the user profile created by your cloud function
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}
