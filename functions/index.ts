require("firebase-functions/logger/compat");
import {
  onValueCreated,
  onValueDeleted,
  onValueWritten,
} from "firebase-functions/v2/database";
import { HttpsError, onRequest } from "firebase-functions/v2/https";
import {
  AuthBlockingEvent,
  beforeUserCreated,
  beforeUserSignedIn,
} from "firebase-functions/v2/identity";
import * as admin from "firebase-admin";
import { defineString } from "firebase-functions/params";

admin.initializeApp();

const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
const DOMAIN = isEmulator
  ? "http://127.0.0.1:5173"
  : "https://theopendissent.com";
const DEFAULT_IMAGE = `${DOMAIN}/favicon.jpg`;
const LARGE_IMAGE = `${DOMAIN}/share-card-logo.jpg`;

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Resolves an ID to its correct database reference by checking both posts and replies.
 * @param {string} id - The postId or replyId to find.
 * @param {string|null} [providedParentId] - Optional parentId to skip the search and generate path directly.
 * @return {Promise<any>} The database reference for the given ID.
 */
const getContentRef = async (
  id: string,
  providedParentId?: string | null,
): Promise<admin.database.Reference | null> => {
  const db = admin.database();

  // 1. use provided parentId if available
  if (providedParentId && providedParentId !== "top") {
    return db.ref(`replies/${providedParentId}/${id}`);
  }

  // 3. fallback to posts
  const postRef = db.ref(`posts/${id}`);
  const postSnap = await postRef.once("value");
  if (postSnap.exists()) return postRef;

  return null;
};

// delete replies in batches to avoid thundering herd
const deleteRepliesInBatches = async (postId: string) => {
  const db = admin.database();
  const repliesRef = db.ref(`replies/${postId}`);

  let finished = false;
  while (!finished) {
    // Get a small chunk of reply IDs
    const snapshot = await repliesRef.limitToFirst(100).once("value");

    if (!snapshot.exists()) {
      finished = true;
      break;
    }

    const updates: Record<string, null> = {};
    snapshot.forEach((child) => {
      updates[child.key as string] = null;
    });

    // Delete this batch
    await repliesRef.update(updates);

    // add a small delay to let CPU/Network breathe
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
};

/**
 * Syncs user interaction SCALAR SCORE from the user's private tree to the public content.
 * Trigger: /users/{userId}/postInteractions/{postId}
 */
export const syncInteractionToPost = onValueWritten(
  "/users/{userId}/postInteractions/{postId}",
  async (event) => {
    const { userId, postId } = event.params;

    const rawVal = event.data.after.val();
    const exists = event.data.after.exists();

    // Extract Score
    // Handle both new object format and potential legacy numbers during transition
    const newScore = exists
      ? typeof rawVal === "object"
        ? rawVal.score
        : rawVal
      : null;

    // 2. Extract Parent ID (for self-repairing path lookup)
    const storedParentId =
      exists && typeof rawVal === "object" ? rawVal.parentId : undefined;

    // If storedParentId is "top", we treat it as undefined for getContentRef logic
    const parentId = storedParentId === "top" ? undefined : storedParentId;

    try {
      // Use the stored parentId to find the content efficiently
      const contentRef = await getContentRef(postId, parentId);

      if (!contentRef) {
        // If content doesn't exist, we clean up the user's orphan record
        if (exists) await event.data.after.ref.set(null);
        return null;
      }

      // Write the score directly to the content's userInteractions map
      // Path: posts/{postId}/userInteractions/{userId} = 4.5
      await contentRef
        .child(`userInteractions/${userId}`)
        .set(exists ? newScore : null);
    } catch (error) {
      console.error(`sync error for ${userId} on ${postId}:`, error);
    }
    return null;
  },
);

/**
 * updates the replyCount on the parent (Post or Reply) when replies are created/deleted.
 */
export const updateReplyCount = onValueWritten(
  "/replies/{parentId}/{replyId}",
  async (event) => {
    const { parentId } = event.params;

    // determine exactly what changed
    const created = event.data.after.exists() && !event.data.before.exists();
    const deleted = !event.data.after.exists() && event.data.before.exists();

    // ignore edits to post content
    if (!created && !deleted) return null;

    const increment = created ? 1 : -1;

    try {
      const parentRef = await getContentRef(parentId);
      if (!parentRef) {
        console.warn(`orphaned reply: parent ${parentId} not found.`);
        return null;
      }

      return parentRef.child("replyCount").transaction((current) => {
        return Math.max(0, (current || 0) + increment);
      });
    } catch (error) {
      console.error(`counter sync failed for parent ${parentId}:`, error);
      return null;
    }
  },
);

const WHITELISTED_EMAILS_PARAM = defineString("WHITELISTED_EMAILS");
const getWhitelistedEmails = (): string[] => {
  // defineString picks up the value injected during firebase deploy
  const rawValue = WHITELISTED_EMAILS_PARAM.value() || "";

  console.log(`debug: raw whitelist string is: "${rawValue}"`);

  if (!rawValue) return [];
  return rawValue.split(",").map((email) => email.trim().toLowerCase());
};

// restricts user's to @g.ucla.edu emails/more
const uclaOnlyAuth = (event: AuthBlockingEvent): void => {
  const user = event.data;
  const email = (user?.email || "no-email").toLowerCase().trim();

  console.log(`checking authorization for: [${email}]`);

  // allow whitelisted
  if (getWhitelistedEmails().includes(email)) {
    console.log(`auth permitted via whitelist for: ${email}`);
    return;
  }

  // reject all other invalid emails
  if (!email.toLowerCase().trim().endsWith("@g.ucla.edu")) {
    console.error(`auth blocked for: ${email}`);
    throw new HttpsError(
      "permission-denied",
      "Only @g.ucla.edu emails are allowed.",
    );
  }

  console.log(`auth permitted for: ${email}`);
};

export const beforecreated = beforeUserCreated(async (event) => {
  uclaOnlyAuth(event);
  const user = event.data;

  const newUserProfile = {
    email: user?.email,
    displayName: user?.displayName,
    createdAt: Date.now(),
  };
  await admin.database().ref(`users/${user?.uid}`).set(newUserProfile);

  return {}; // success
});

export const beforesignedin = beforeUserSignedIn((event) => {
  uclaOnlyAuth(event);
  return {}; // success
});

/**
 * Clean up user interaction references when a post or reply is deleted.
 * @param {string} postId - the ID of the post or reply being cleaned up.
 * @param {Record<string, number>} interactions - the map of { userId: score }.
 */
const cleanupUserInteractions = async (
  postId: string,
  interactions: Record<string, number> | undefined,
): Promise<void> => {
  if (!interactions) return;

  const updates: Record<string, null> = {};

  // interactions is { "user_abc": 5, "user_xyz": -2 }
  Object.keys(interactions).forEach((uid) => {
    // Remove the record from the user's profile
    updates[`users/${uid}/postInteractions/${postId}`] = null;
  });

  // chunk updates to prevent payload from being too large for single Firebase write
  const keys = Object.keys(updates);
  if (keys.length === 0) return;

  // Split into batches of 500
  for (let i = 0; i < keys.length; i += 500) {
    const batch: Record<string, null> = {};
    keys.slice(i, i + 500).forEach((key) => {
      batch[key] = null;
    });
    await admin.database().ref().update(batch);
  }
};

/**
 * Cleanup for top-level posts.
 * Only triggers when a post is removed.
 */
export const onPostDeletedCleanup = onValueDeleted(
  "/posts/{postId}",
  async (event) => {
    const { postId } = event.params;
    const postData = event.data.val();
    const db = admin.database();

    if (!postData) return;

    // immediate cleanup of the post's own interactions
    await cleanupUserInteractions(postId, postData.userInteractions);
    const replyCount = postData.replyCount || 0;

    if (replyCount < 100) {
      // Small post: Safe to delete all at once
      await db.ref(`replies/${postId}`).remove();
    } else {
      // Large post: delete in chunks to avoid overwhelming the system
      await deleteRepliesInBatches(postId);
    }
  },
);

/**
 * Cleanup for individual replies.
 * Only triggers when a reply is removed (manually or via cascade).
 */
export const onReplyDeletedCleanup = onValueDeleted(
  "/replies/{parentId}/{replyId}",
  async (event) => {
    const { parentId, replyId } = event.params;
    const replyData = event.data.val();
    const db = admin.database();

    if (!replyData) return;

    await cleanupUserInteractions(replyId, replyData.userInteractions);

    // cleanup from flat map
    const updates: Record<string, null> = {};

    if (replyData?.userId) {
      updates[`users/${replyData.userId}/replies/${parentId}/${replyId}`] =
        null;
    }

    return db.ref().update(updates);
  },
);

/**
 * Serves dynamic HTML with Open Graph tags for iMessage/Social previews.
 * Usage: https://site.com/share?s=<postId>&p=<parentId>
 */
export const sharePost = onRequest(async (req, res) => {
  const postId = req.query.s as string;
  const parentId = req.query.p as string;

  if (!postId) return res.redirect(DOMAIN);

  try {
    const contentRef = await getContentRef(postId, parentId);
    const snapshot = await contentRef?.once("value");
    const data = snapshot?.val();

    if (!data) return res.redirect(DOMAIN);

    const rawContent =
      data.postContent || "View this discussion on The Open Dissent.";
    const cleanContent = escapeHtml(rawContent);

    // prepare author ID
    const rawUserId = data.userId || "";
    const authorDisplay =
      rawUserId.length > 5 ? `${rawUserId.slice(0, 5)}...` : rawUserId;

    // increased limit to 200 chars for better iMessage utilization
    const maxLength = 300;
    const contentPreview =
      cleanContent.length > maxLength
        ? `${cleanContent.slice(0, maxLength)}...`
        : cleanContent;

    // TODO: add reply count here
    const pageTitle = `@${authorDisplay} on TheOpenDissent.com`;
    const pageDescription = `“${contentPreview}”`;

    // keep the shareUrl pointing to THIS function so meta tags work on re-shares
    const shareUrl = `${DOMAIN}/share?s=${postId}${parentId ? `&p=${parentId}` : ""}`;

    // redirect to new "/post" route
    let appUrl = `${DOMAIN}/post/${postId}`;

    // If parentId exists, 'postId' is actually the Reply ID (s), and 'parentId' is the Post (p)
    if (parentId) {
      appUrl = `${DOMAIN}/post/${parentId}?reply=${postId}`;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${pageTitle}</title>

        <link rel="icon" href="${DEFAULT_IMAGE}" />
        <link rel="apple-touch-icon" href="${DEFAULT_IMAGE}" />

        <link rel="alternate" type="application/activity+json" href="${shareUrl}" />

        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="The Open Dissent" />
        <meta property="og:url" content="${shareUrl}" />

        <meta property="og:title" content="${pageTitle}" />
        <meta property="og:description" content="${pageDescription}" />

        <meta property="og:image" content="${LARGE_IMAGE}" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="628" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${pageTitle}" />
        <meta name="twitter:description" content="${pageDescription}" />
        <meta name="twitter:image" content="${LARGE_IMAGE}" />
      </head>
      <body>
        <p>Redirecting to discussion...</p>
        <script>
          window.location.href = "${appUrl}";
        </script>
      </body>
      </html>
    `;

    res.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.send(html);
  } catch (error) {
    console.error("Error serving share meta:", error);
    res.redirect(DOMAIN);
  }
});

/**
 * handles setup tasks when a new reply is created.
 * links the reply to the user's profile and stores path metadata.
 */
export const onReplyCreated = onValueCreated(
  "/replies/{parentId}/{replyId}",
  async (event) => {
    const { parentId, replyId } = event.params;
    const replyData = event.data.val();
    const db = admin.database();

    if (!replyData) return null;

    const updates: Record<string, string | boolean | null> = {};

    // link to user's profile
    if (replyData.userId) {
      updates[`users/${replyData.userId}/replies/${parentId}/${replyId}`] =
        true;
    }

    try {
      await db.ref().update(updates);
      console.log(
        `successfully linked reply ${replyId} to user ${replyData.userId}`,
      );
    } catch (error) {
      console.error(`failed to link reply ${replyId}:`, error);
    }

    return null;
  },
);
