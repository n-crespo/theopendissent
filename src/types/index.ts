export interface Post {
  id: string;
  userId?: string; // Optional for newer anonymous posts
  authorDisplay?: string; // e.g., "Anonymous User", "User_...", or "Display Name"
  postContent: string;
  timestamp: number | object;
  editedAt?: number;
  replyCount: number;
  parentPostId?: string;
  interactionScore?: number; // -3 to 3
  isThreadAuthor?: boolean;
  parentReplyId?: string; // sub-reply only: ID of the direct reply being responded to
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}
