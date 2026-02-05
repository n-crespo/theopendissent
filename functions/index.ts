require("firebase-functions/logger/compat");
import { onValueDeleted, onValueWritten } from "firebase-functions/v2/database";
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
 * Resolves an ID to its correct database reference by checking both posts and replies.
 * @param {string} id - The postId or replyId to find.
 * @param {string|null} [parentId] - Optional parentId to skip the search and generate path directly.
 * @return {Promise<any>} The database reference for the given ID.
 */
const getContentRef = async (
  id: string,
  parentId?: string | null,
): Promise<admin.database.Reference | null> => {
  const db = admin.database();

  // if parentId is provided and valid, we know exactly where it is.
  if (parentId && parentId !== "top") {
    return db.ref(`replies/${parentId}/${id}`);
  }

  // if no parentId, check if it's a top-level post.
  const postRef = db.ref(`posts/${id}`);
  const postSnap = await postRef.once("value");
  if (postSnap.exists()) return postRef;

  // fallback: search for the grandparent in the replies tree.
  const repliesRef = db.ref("replies");
  const parentSearch = await repliesRef.orderByKey().once("value");

  let foundRef: admin.database.Reference | null = null;
  parentSearch.forEach((grandparentSnap) => {
    if (grandparentSnap.hasChild(id)) {
      foundRef = grandparentSnap.child(id).ref;
      return true; // stop iterating
    }
    return false;
  });

  return foundRef;
};

/**
 * syncs user interactions from the user's private tree to the public post or reply tree.
 */
export const syncInteractionToPost = onValueWritten(
  "/users/{userId}/postInteractions/{interactionType}/{postId}",
  async (event) => {
    const { userId, interactionType, postId } = event.params;
    const exists = event.data.after.exists();
    const parentId = event.data.after.val() || event.data.before.val();

    try {
      const contentRef = await getContentRef(postId, parentId);
      if (!contentRef) {
        if (exists) await event.data.after.ref.set(null); // cleanup ghost interaction
        return null;
      }

      await contentRef
        .child(`userInteractions/${interactionType}/${userId}`)
        .set(exists ? true : null);
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
 * Only triggers when a reply is removed (manually or via cascade).
 */
export const onReplyDeletedCleanup = onValueDeleted(
  "/replies/{parentId}/{replyId}",
  async (event) => {
    const { parentId, replyId } = event.params;
    const replyData = event.data.val();

    if (!replyData) return;

    await cleanupUserInteractions(replyId, replyData.userInteractions);

    // remove the reply reference from the author's profile
    if (replyData.userId) {
      await admin
        .database()
        .ref(`users/${replyData.userId}/replies/${parentId}/${replyId}`)
        .remove();
    }

    console.log(`Cleaned up reply ${replyId} and user reference.`);
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
