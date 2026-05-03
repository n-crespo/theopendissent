import { Post } from "../types/index.ts";

/**
 * Server timestamp placeholder — works in both the Firebase client SDK
 * (`update()` accepts raw wire format) and `@firebase/rules-unit-testing`.
 */
const SERVER_TIMESTAMP = { ".sv": "timestamp" };

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export interface BuildCreateOptions {
  key: string;
  userId: string;
  content: string;
  authorDisplay: string;
  parentPostId?: string;
  parentReplyId?: string;
  score?: number;
  isThreadAuthor?: boolean;
}

/**
 * Builds the atomic multi-path update for creating a post, reply, or sub-reply.
 * Returns a flat `Record<string, any>` ready for `db.ref().update()`.
 */
export const buildCreateUpdates = ({
  key,
  userId,
  content,
  authorDisplay,
  parentPostId,
  parentReplyId,
  score,
  isThreadAuthor,
}: BuildCreateOptions): Record<string, any> => {
  const updates: Record<string, any> = {};

  if (parentReplyId && parentPostId) {
    // sub-reply
    updates[`subreplies/${parentPostId}/${parentReplyId}/${key}`] = {
      id: key,
      authorDisplay,
      postContent: content,
      timestamp: SERVER_TIMESTAMP,
      parentPostId,
      parentReplyId,
      ...(isThreadAuthor ? { isThreadAuthor } : {}),
    };
    updates[
      `users/${userId}/subreplies/${parentPostId}/${parentReplyId}/${key}`
    ] = true;
    updates[`authorLookup/${key}`] = {
      uid: userId,
      type: "subreply",
      postId: parentPostId,
      replyId: parentReplyId,
    };
  } else if (parentPostId) {
    // reply
    updates[`replies/${parentPostId}/${key}`] = {
      id: key,
      authorDisplay,
      postContent: content,
      timestamp: SERVER_TIMESTAMP,
      replyCount: 0,
      parentPostId,
      ...(score !== undefined ? { interactionScore: score } : {}),
      ...(isThreadAuthor !== undefined ? { isThreadAuthor } : {}),
    };
    updates[`users/${userId}/replies/${parentPostId}/${key}`] = true;
    updates[`authorLookup/${key}`] = {
      uid: userId,
      type: "reply",
      postId: parentPostId,
    };
  } else {
    // top-level post
    updates[`posts/${key}`] = {
      id: key,
      authorDisplay,
      postContent: content,
      timestamp: SERVER_TIMESTAMP,
      replyCount: 0,
    };
    updates[`users/${userId}/posts/${key}`] = true;
    updates[`authorLookup/${key}`] = {
      uid: userId,
      type: "post",
    };
  }

  return updates;
};

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/**
 * Builds the atomic multi-path null-update for deleting a post, reply, or sub-reply.
 */
export const buildDeleteUpdates = (
  post: Pick<Post, "id" | "parentPostId" | "parentReplyId">,
  userId: string,
): Record<string, any> => {
  const { id, parentPostId, parentReplyId } = post;
  const updates: Record<string, any> = {};

  // authorLookup is flat keyed by content id
  updates[`authorLookup/${id}`] = null;

  if (parentReplyId && parentPostId) {
    updates[`subreplies/${parentPostId}/${parentReplyId}/${id}`] = null;
    updates[
      `users/${userId}/subreplies/${parentPostId}/${parentReplyId}/${id}`
    ] = null;
  } else if (parentPostId) {
    updates[`replies/${parentPostId}/${id}`] = null;
    updates[`users/${userId}/replies/${parentPostId}/${id}`] = null;
  } else {
    updates[`posts/${id}`] = null;
    updates[`users/${userId}/posts/${id}`] = null;
    // cloud function handles cascade to replies/subreplies
  }

  return updates;
};

// ---------------------------------------------------------------------------
// Edit
// ---------------------------------------------------------------------------

/**
 * Builds the multi-path update for editing postContent and/or editedAt.
 */
export const buildEditUpdates = (
  post: Pick<Post, "id" | "parentPostId" | "parentReplyId">,
  changes: Partial<Pick<Post, "postContent" | "editedAt">>,
): Record<string, any> => {
  const { id, parentPostId, parentReplyId } = post;
  const path =
    parentReplyId && parentPostId
      ? `subreplies/${parentPostId}/${parentReplyId}/${id}`
      : parentPostId
        ? `replies/${parentPostId}/${id}`
        : `posts/${id}`;

  return {
    [`${path}/postContent`]: changes.postContent,
    [`${path}/editedAt`]: changes.editedAt,
  };
};

// ---------------------------------------------------------------------------
// Share URL
// ---------------------------------------------------------------------------

/**
 * Builds the share URL for a post, reply, or sub-reply.
 * Pure function — takes origin as a parameter instead of reading window.location.
 */
export const buildShareUrl = (
  post: Pick<Post, "id" | "parentPostId" | "parentReplyId">,
  origin: string,
): string => {
  const url = new URL(origin);
  url.pathname = "/share";

  const { id, parentPostId, parentReplyId } = post;

  url.searchParams.set("s", id);

  if (parentReplyId && parentPostId) {
    // sub-reply: p = direct parent (reply), r = root (post)
    url.searchParams.set("p", parentReplyId);
    url.searchParams.set("r", parentPostId);
  } else if (parentPostId) {
    // reply: p = parent post
    url.searchParams.set("p", parentPostId);
  }

  return url.toString();
};
