require("firebase-functions/logger/compat");
import { onValueWritten } from "firebase-functions/v2/database";
import { HttpsError, onRequest } from "firebase-functions/v2/https";
import {
  AuthBlockingEvent,
  beforeUserCreated,
  beforeUserSignedIn,
} from "firebase-functions/v2/identity";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * matches the structure of userInteractions stored on posts and replies.
 */
interface InteractionNode {
  agreed?: Record<string, boolean>;
  dissented?: Record<string, boolean>;
}

const DOMAIN = "https://theopendissent.com";
const DEFAULT_IMAGE = `${DOMAIN}/logo.png`;

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

    // replyCount is a top-level field on the post
    const postRef = admin.database().ref(`/posts/${postId}/replyCount`);

    return postRef.transaction((currentCount: number | null) => {
      // treat null/undefined as 0
      const count = currentCount || 0;
      return Math.max(0, count + incrementValue);
    });
  },
);

const uclaOnlyAuth = (event: AuthBlockingEvent): void => {
  const user = event.data;
  const email = user?.email || "no-email";

  console.log(`checking authorization for: [${email}]`);

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
    createdAt: admin.database.ServerValue.TIMESTAMP,
  };
  await admin.database().ref(`users/${user?.uid}`).set(newUserProfile);
});

export const beforesignedin = beforeUserSignedIn((event) => {
  uclaOnlyAuth(event);
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
 * cleanup for top-level posts.
 */
export const onPostDeletedCleanup = onValueWritten(
  "/posts/{postId}",
  async (event) => {
    if (event.data.after.exists() || !event.data.before.exists()) return;
    const postData = event.data.before.val();
    // pass the ID and the interaction sub-node
    await cleanupUserInteractions(
      event.params.postId,
      postData.userInteractions,
    );
  },
);

/**
 * cleanup for individual replies.
 */
export const onReplyDeletedCleanup = onValueWritten(
  "/replies/{parentId}/{replyId}",
  async (event) => {
    if (event.data.after.exists() || !event.data.before.exists()) return;
    const replyData = event.data.before.val();
    // pass the ID and the interaction sub-node
    await cleanupUserInteractions(
      event.params.replyId,
      replyData.userInteractions,
    );
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

    // 1. Prepare Content
    const interactions = data.userInteractions || {};
    const agreedCount = interactions.agreed
      ? Object.keys(interactions.agreed).length
      : 0;
    const dissentedCount = interactions.dissented
      ? Object.keys(interactions.dissented).length
      : 0;

    const rawContent = data.postContent || "";
    const cleanContent = escapeHtml(rawContent);
    const contentPreview =
      cleanContent.length > 80
        ? `${cleanContent.slice(0, 77)}...`
        : cleanContent;

    // The Bold Header
    const pageTitle = `• ${agreedCount} agrees, ${dissentedCount} dissents`;

    // The Post Content (Apple explicitly asks for this in og:description)
    const pageDescription = contentPreview;

    const shareUrl = `${DOMAIN}/share?s=${postId}${parentId ? `&p=${parentId}` : ""}`;
    const appUrl = `${DOMAIN}/?s=${postId}${parentId ? `&p=${parentId}` : ""}`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${pageTitle}</title>

        <link rel="alternate" type="application/activity+json" href="${shareUrl}" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="The Open Dissent" />
        <meta property="og:url" content="${shareUrl}" />

        <meta property="og:title" content="${pageTitle}" />

        <meta property="og:description" content="${pageDescription}" />

        <meta property="og:image" content="${DEFAULT_IMAGE}" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${pageTitle}" />
        <meta name="twitter:description" content="${pageDescription}" />
        <meta name="twitter:image" content="${DEFAULT_IMAGE}" />
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
