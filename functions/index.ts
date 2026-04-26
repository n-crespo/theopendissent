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
const LARGE_IMAGE = `${DOMAIN}/og-image.jpg`;

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

  // console.log(`debug: raw whitelist string is: "${rawValue}"`);

  if (!rawValue) return [];
  return rawValue.split(",").map((email) => email.trim().toLowerCase());
};

/*
 * Validates that the signing-in user has a legitimate UCLA-affiliated email.
 * This includes students (@g.ucla.edu), faculty (@ucla.edu), and departments (@cs.ucla.edu).
 */
const uclaOnlyAuth = (event: AuthBlockingEvent): void => {
  const user = event.data;
  const email = (user?.email || "no-email").toLowerCase().trim();

  console.log(`checking authorization for: [${email}]`);

  // allow whitelisted
  if (getWhitelistedEmails().includes(email)) {
    console.log(`auth permitted via whitelist for: ${email}`);
    return;
  }

  const domain = email.split("@")[1];
  const isUcla = domain === "ucla.edu" || domain.endsWith(".ucla.edu");

  if (!isUcla) {
    console.error(`auth blocked for: ${email}`);
    throw new HttpsError(
      "permission-denied",
      "Only UCLA-affiliated emails are allowed.",
    );
  }

  // console.log(`auth permitted for: ${email}`);
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
    if (!replyData) return;

    const db = admin.database();
    const updates: Record<string, null> = {};

    // if the post was made non-anonymously, clean up the user receipt.
    // otherwise, it'll be cleaned up later.
    // TODO: ensure dangling pointer is self-deleted on read (to avoid
    // performance overhead of doing it automatically)
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
    const authorDisplay = data.authorDisplay || "Anonymous User";

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
 * Automatically creates or updates a notification for the post owner when a new reply is created.
 */
export const onReplyCreatedNotification = onValueCreated(
  "/replies/{parentId}/{replyId}",
  async (event) => {
    const { parentId, replyId } = event.params;
    const replyData = event.data.val();
    const db = admin.database();

    if (!replyData || !replyData.userId) return null;

    try {
      // find the owner of the content being replied to
      const parentRef = await getContentRef(parentId);
      if (!parentRef) {
        console.warn(
          `Parent content ${parentId} not found. Skipping notification.`,
        );
        return null;
      }

      const parentSnap = await parentRef.once("value");
      const parentData = parentSnap.val();
      const ownerId = parentData?.userId;

      // don't notify if the user is replying to their own content
      if (!ownerId || ownerId === replyData.userId) return null;

      // define the path for the notification
      // We use parentId (the post being replied to) as the notification ID for aggregation
      const notifRef = db.ref(`users/${ownerId}/notifications/${parentId}`);

      const now = Date.now();

      return notifRef.transaction((current) => {
        if (current) {
          // If notification exists, increment count and mark as unread
          return {
            ...current,
            count: (current.count || 1) + 1,
            latestReplyId: replyId,
            isRead: false,
            updatedAt: now,
          };
        } else {
          // Create new notification
          return {
            type: "reply",
            count: 1,
            latestReplyId: replyId,
            isRead: false,
            createdAt: now,
            updatedAt: now,
          };
        }
      });
    } catch (error) {
      console.error(`Notification trigger failed for reply ${replyId}:`, error);
      return null;
    }
  },
);
