require("firebase-functions/logger/compat");
import { onValueWritten } from "firebase-functions/v2/database";
import { HttpsError, onRequest } from "firebase-functions/v2/https";
import {
  AuthBlockingEvent,
  beforeUserCreated,
  beforeUserSignedIn,
} from "firebase-functions/v2/identity";
import * as admin from "firebase-admin";
import { defineString } from "firebase-functions/params";

admin.initializeApp();

/**
 * matches the structure of userInteractions stored on posts and replies.
 */
interface InteractionNode {
  agreed?: Record<string, boolean>;
  dissented?: Record<string, boolean>;
}

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
 * syncs user interactions from the user's private tree to the public post or reply tree.
 */
export const syncInteractionToPost = onValueWritten(
  "/users/{userId}/postInteractions/{interactionType}/{postId}",
  async (event) => {
    const { userId, interactionType, postId } = event.params;
    const afterValue = event.data.after.val() as string | null;
    const beforeValue = event.data.before.val() as string | null;
    const exists = event.data.after.exists();

    // Use beforeValue for cleanup if the interaction was removed
    const parentId = exists ? afterValue : beforeValue;
    const db = admin.database();

    let rootPath: string;
    if (parentId && parentId !== "top") {
      rootPath = `replies/${parentId}/${postId}`;
    } else {
      rootPath = `posts/${postId}`;
    }

    const targetPath = `${rootPath}/userInteractions/${interactionType}/${userId}`;

    // sync marker to the target post/reply
    return db.ref(targetPath).set(exists ? true : null);
  },
);

/**
 * updates the replyCount on the parent post when replies are created.
 */
export const updateReplyCount = onValueWritten(
  "/replies/{postId}/{replyId}",
  async (event) => {
    const { postId } = event.params;
    const before = event.data.before.exists();
    const after = event.data.after.exists();

    let incrementValue = 0;
    if (after && !before) incrementValue = 1;
    else if (!after && before) incrementValue = -1;
    else return;

    const db = admin.database();
    const postRef = db.ref(`/posts/${postId}`);

    // Check if post exists before trying to update it
    const postSnap = await postRef.once("value");
    if (!postSnap.exists()) {
      console.log(`Parent post ${postId} not found. Skipping counter update.`);
      return;
    }

    // the post exists, so we update the counter
    return postRef
      .child("replyCount")
      .transaction((currentCount: number | null) => {
        const count = currentCount || 0;
        return Math.max(0, count + incrementValue);
      });
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
 * @param {InteractionNode} interactions - the interaction object containing user UIDs.
 * @return {Promise<void>}
 */
const cleanupUserInteractions = async (
  postId: string,
  interactions: InteractionNode | undefined,
): Promise<void> => {
  if (!interactions) return;
  const updates: Record<string, null> = {};

  const types = ["agreed", "dissented"] as const;

  types.forEach((type) => {
    const interactionTypeGroup = interactions[type];
    if (interactionTypeGroup) {
      Object.keys(interactionTypeGroup).forEach((uid) => {
        updates[`users/${uid}/postInteractions/${type}/${postId}`] = null;
      });
    }
  });

  if (Object.keys(updates).length > 0) {
    await admin.database().ref().update(updates);
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

    // event.data contains the snapshot of the data immediately BEFORE it was deleted.
    const postData = event.data.val();
    const db = admin.database();

    if (!postData) return;

    console.log(`Cleaning up interactions and cascading for post: ${postId}`);

    // 1. Clean up interactions for the post itself
    await cleanupUserInteractions(postId, postData.userInteractions);

    // This deletion will automatically trigger 'onReplyDeletedCleanup'
    // for every child reply inside this node, handling their profile
    // references and interaction cleanups individually.
    await db.ref(`replies/${postId}`).remove();

    console.log(`Cascade cleanup triggered for post: ${postId}`);
  },
);

/**
 * Cleanup for individual replies.
 * Also removes reply reference from the user's profile.
 */
export const onReplyDeletedCleanup = onValueWritten(
  "/replies/{parentId}/{replyId}",
  async (event) => {
    if (event.data.after.exists() || !event.data.before.exists()) return;

    const { parentId, replyId } = event.params;
    const replyData = event.data.before.val();

    await cleanupUserInteractions(replyId, replyData.userInteractions);

    // remove the reply reference from the author's profile
    if (replyData.userId) {
      await admin
        .database()
        .ref(`users/${replyData.userId}/replies/${parentId}/${replyId}`)
        .remove();
    }
  },
);

/**
 * Serves dynamic HTML with Open Graph tags for iMessage/Social previews.
 * Usage: https://site.com/share?s=<postId>&p=<parentId>
 */
export const sharePost = onRequest(async (req, res) => {
  const postId = req.query.s as string;
  const parentId = req.query.p as string;

  if (!postId) {
    res.redirect(DOMAIN);
    return;
  }

  const db = admin.database();
  const dbPath = parentId ? `replies/${parentId}/${postId}` : `posts/${postId}`;

  try {
    const snapshot = await db.ref(dbPath).once("value");
    const data = snapshot.val();

    if (!data) {
      res.redirect(DOMAIN);
      return;
    }

    // prepare content
    const interactions = data.userInteractions || {};
    const agreedCount = interactions.agreed
      ? Object.keys(interactions.agreed).length
      : 0;
    const dissentedCount = interactions.dissented
      ? Object.keys(interactions.dissented).length
      : 0;

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

    const pageTitle = `@${authorDisplay} • ${agreedCount} agreed • ${dissentedCount} dissented`;
    const pageDescription = `“${contentPreview}”`;

    const shareUrl = `${DOMAIN}/share?s=${postId}${parentId ? `&p=${parentId}` : ""}`;
    const appUrl = `${DOMAIN}/?s=${postId}${parentId ? `&p=${parentId}` : ""}`;

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
