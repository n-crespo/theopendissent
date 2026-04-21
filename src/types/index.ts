export type PostInteractions = Record<string, number>;

export interface Post {
  id: string;
  userId?: string; // Optional for newer anonymous posts
  authorDisplay?: string; // e.g., "Anonymous User", "User_...", or "Display Name"
  postContent: string;
  timestamp: number | object;
  editedAt?: number;
  replyCount: number;
  userInteractions: PostInteractions;
  parentPostId?: string;
  interactionScore?: number; // -3 to 3
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}
