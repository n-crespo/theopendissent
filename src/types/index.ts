export type PostInteractions = Record<string, number>;

export interface Post {
  id: string;
  userId: string;
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
