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

/** * Helper: Fetches the metadata from authorLookup to find the owner
 * and the exact path of any content ID.
 */
const getLookupData = async (id: string) => {
  const snap = await admin.database().ref(`authorLookup/${id}`).once("value");
  return snap.exists() ? snap.val() : null;
};

/**
 * Uses authorLookup routing data to return a direct reference.
 * No more searching/fallback required.
 */
const getContentRef = async (
  id: string,
): Promise<admin.database.Reference | null> => {
  const meta = await getLookupData(id);
  if (!meta) return null;

  const db = admin.database();
  switch (meta.type) {
    case "post":
      return db.ref(`posts/${id}`);
    case "reply":
      return db.ref(`replies/${meta.postId}/${id}`);
    case "subreply":
      return db.ref(`subreplies/${meta.postId}/${meta.replyId}/${id}`);
    default:
      return null;
  }
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

/*
 * Shared helper to synchronize a parent's replyCount.
 * Safely guards against ghost-node creation during cascading deletes.
 */
const syncReplyCount = async (
  parentRef: admin.database.Reference,
  created: boolean,
  deleted: boolean,
  parentIdLog: string,
) => {
  if (!created && !deleted) return null;

  const increment = created ? 1 : -1;

  try {
    // on delete: guard against ghost-node creation when the parent
    // was already removed (e.g. cascade delete)
    if (deleted) {
      const parentSnap = await parentRef.once("value");
      if (!parentSnap.exists()) return null;
    }

    return parentRef.child("replyCount").transaction((current) => {
      return Math.max(0, (current || 0) + increment);
    });
  } catch (error) {
    console.error(`counter sync failed for parent ${parentIdLog}:`, error);
    return null;
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

    if (!created && !deleted) return null;

    const parentRef = await getContentRef(parentId);
    if (!parentRef) {
      console.warn(`orphaned reply: parent ${parentId} not found.`);
      return null;
    }

    return syncReplyCount(parentRef, created, deleted, parentId);
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
 */
export const onPostDeletedCleanup = onValueDeleted(
  "/posts/{postId}",
  async (event) => {
    const { postId } = event.params;
    const db = admin.database();

    // Clean up author lookup
    await db.ref(`authorLookup/${postId}`).remove();

    const postData = event.data.val();
    if (!postData) return;

    if ((postData.replyCount || 0) < 100) {
      await db.ref(`replies/${postId}`).remove();
    } else {
      await deleteRepliesInBatches(postId);
    }
  },
);

/**
 * Cleanup for sub-replies (Added this trigger for completeness)
 */
export const onSubReplyDeletedCleanup = onValueDeleted(
  "/subreplies/{postId}/{replyId}/{subReplyId}",
  async (event) => {
    const { postId, replyId, subReplyId } = event.params;
    const db = admin.database();

    const meta = await getLookupData(subReplyId);
    if (meta) {
      const updates: Record<string, null> = {};
      updates[`authorLookup/${subReplyId}`] = null;
      updates[
        `users/${meta.uid}/subreplies/${postId}/${replyId}/${subReplyId}`
      ] = null;
      await db.ref().update(updates);
    }
  },
);

/**
 * Cleanup for individual replies.
 */
export const onReplyDeletedCleanup = onValueDeleted(
  "/replies/{parentId}/{replyId}",
  async (event) => {
    const { parentId, replyId } = event.params;
    const db = admin.database();

    const meta = await getLookupData(replyId);

    const updates: Record<string, null> = {};
    if (meta) {
      updates[`authorLookup/${replyId}`] = null;
      updates[`users/${meta.uid}/replies/${parentId}/${replyId}`] = null;
    }

    // Instead of a separate .remove(), just add it to the atomic update
    updates[`subreplies/${parentId}/${replyId}`] = null;

    return db.ref().update(updates);
  },
);

/**
 * Manages the subReplyCount counter on parent reply when sub-replies are created or deleted.
 */
export const updateSubReplyCount = onValueWritten(
  "/subreplies/{rootPostId}/{parentReplyId}/{subReplyId}",
  async (event) => {
    const { rootPostId, parentReplyId } = event.params;
    const db = admin.database();

    const created = event.data.after.exists() && !event.data.before.exists();
    const deleted = !event.data.after.exists() && event.data.before.exists();

    const parentReplyRef = db.ref(`replies/${rootPostId}/${parentReplyId}`);
    return syncReplyCount(parentReplyRef, created, deleted, parentReplyId);
  },
);

/**
 * Serves dynamic HTML with Open Graph tags for iMessage/Social previews.
 * Usage: https://site.com/share?s=<postId>&p=<parentId>&r=<rootId>
 */
export const sharePost = onRequest(async (req, res) => {
  const postId = req.query.s as string;
  const parentId = req.query.p as string;
  const rootId = req.query.r as string; // minimal change: added rootId

  if (!postId) return res.redirect(DOMAIN);

  try {
    // added rootId to support sub-reply lookups
    const contentRef =
      rootId && parentId
        ? admin.database().ref(`subreplies/${rootId}/${parentId}/${postId}`)
        : parentId
          ? admin.database().ref(`replies/${parentId}/${postId}`)
          : admin.database().ref(`posts/${postId}`);
    const snapshot = await contentRef?.once("value");
    const data = snapshot?.val();

    if (!data) return res.redirect(DOMAIN);

    const rawContent =
      data.postContent || "View this discussion on The Open Dissent.";
    const cleanContent = escapeHtml(rawContent);

    // prepare author ID
    const authorDisplay = data.authorDisplay || "Anonymous User";

    const maxLength = 300;
    const contentPreview =
      cleanContent.length > maxLength
        ? `${cleanContent.slice(0, maxLength)}...`
        : cleanContent;

    const pageTitle = `@${authorDisplay} on TheOpenDissent.com`;
    const pageDescription = `“${contentPreview}”`;

    // added rootId to shareUrl to maintain metadata on re-shares
    const shareUrl = `${DOMAIN}/share?s=${postId}${parentId ? `&p=${parentId}` : ""}${rootId ? `&r=${rootId}` : ""}`;

    // logic to determine the correct app route
    let appUrl = `${DOMAIN}/post/${postId}`;

    if (rootId && parentId) {
      // sub-reply deep link
      appUrl = `${DOMAIN}/post/${rootId}?reply=${parentId}&subreply=${postId}`;
    } else if (parentId) {
      // standard reply deep link
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

    if (!replyData) return null;

    try {
      // Get the author of the NEW reply
      const replyMeta = await getLookupData(replyId);
      const replyAuthorId = replyMeta?.uid;

      // Get the author of the PARENT content (Post or Reply)
      const parentMeta = await getLookupData(parentId);
      const ownerId = parentMeta?.uid;

      // Don't notify if parent doesn't exist or user is replying to self
      if (!ownerId || ownerId === replyAuthorId) return null;

      const notifRef = db.ref(`users/${ownerId}/notifications/${parentId}`);
      const now = Date.now();

      return notifRef.transaction((current) => {
        const base = current || {
          type: "reply",
          count: 0,
          createdAt: now,
          isRead: false,
        };
        return {
          ...base,
          count: base.count + 1,
          latestReplyId: replyId,
          isRead: false,
          updatedAt: now,
        };
      });
    } catch (error) {
      console.error(`Notification failed for reply ${replyId}:`, error);
      return null;
    }
  },
);

/**
 * Automatically creates or updates a notification for the direct reply owner
 * when a new sub-reply is created.
 */
export const onSubReplyCreatedNotification = onValueCreated(
  "/subreplies/{rootPostId}/{parentReplyId}/{subReplyId}",
  async (event) => {
    const { parentReplyId, subReplyId } = event.params;
    const db = admin.database();

    try {
      const subReplyMeta = await getLookupData(subReplyId);
      const parentReplyMeta = await getLookupData(parentReplyId);

      const replyAuthorId = subReplyMeta?.uid;
      const ownerId = parentReplyMeta?.uid;

      if (!ownerId || ownerId === replyAuthorId) return null;

      const notifRef = db.ref(
        `users/${ownerId}/notifications/${parentReplyId}`,
      );
      const now = Date.now();

      return notifRef.transaction((current) => {
        const base = current || {
          type: "reply",
          count: 0,
          createdAt: now,
          isRead: false,
        };
        return {
          ...base,
          count: base.count + 1,
          latestReplyId: subReplyId,
          isRead: false,
          updatedAt: now,
        };
      });
    } catch (error) {
      console.error(`Notification failed for sub-reply ${subReplyId}:`, error);
      return null;
    }
  },
);
