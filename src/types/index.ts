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
  replyCount: number;
  userInteractions: PostInteractions;
  parentPostId?: string;
  userInteractionType?: "agreed" | "dissented";
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}
