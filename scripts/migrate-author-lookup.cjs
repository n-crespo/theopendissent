/**
 * One-time migration script for the authorLookup table.
 *
 * What it does:
 *   1. Reads all posts/, replies/, and subreplies/ nodes.
 *   2. For every content node that still has a `userId` field:
 *      a. Creates an `authorLookup/{id}` entry (if missing).
 *      b. Removes `userId` from the content node.
 *      c. Also strips any other legacy fields (content, likes, etc.).
 *   3. Backfills `authorDisplay` as "Anonymous User" on any node missing it.
 *   4. Commits everything in a single multi-path update.
 *
 * Safety:
 *   - Runs in DRY-RUN mode by default. Pass `--commit` to actually write.
 *   - Logs every planned change for review before committing.
 *
 * Usage:
 *   node scripts/migrate-author-lookup.cjs              # dry run
 *   node scripts/migrate-author-lookup.cjs --commit      # write to DB
 *
 * Prerequisites:
 *   - Place your service-account.json in the project root (or scripts/ dir).
 *   - npm install firebase-admin (or use the one from functions/).
 */

const admin = require("firebase-admin");
const path = require("path");

// --- Configuration -----------------------------------------------------------

// Try loading service account from project root, then scripts dir
let serviceAccount;
try {
  serviceAccount = require(path.resolve(__dirname, "../service-account.json"));
} catch {
  try {
    serviceAccount = require(path.resolve(__dirname, "./service-account.json"));
  } catch {
    console.error(
      "ERROR: Could not find service-account.json in project root or scripts/ dir.",
    );
    console.error(
      "   Download it from Firebase Console > Project Settings > Service Accounts.",
    );
    process.exit(1);
  }
}

// UPDATE THIS to match your production database URL
const DATABASE_URL =
  "https://the-open-dissent-prod-default-rtdb.firebaseio.com";

// Legacy fields that should not exist on content nodes (will be removed)
const LEGACY_FIELDS_TO_STRIP = ["userId", "content", "likes", "dislikes"];

// --- Init --------------------------------------------------------------------

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: DATABASE_URL,
});

const db = admin.database();
const DRY_RUN = !process.argv.includes("--commit");

// --- Helpers -----------------------------------------------------------------

const stats = {
  postsScanned: 0,
  repliesScanned: 0,
  subRepliesScanned: 0,
  lookupCreated: 0,
  fieldsStripped: 0,
  displayBackfilled: 0,
  alreadyClean: 0,
  orphaned: 0,
};

/**
 * Process a single content node. Returns the update entries (if any).
 */
function processNode(id, data, type, context = {}) {
  const updates = {};
  let touched = false;

  // 1. Create authorLookup entry if missing (requires userId to exist)
  //    If userId is missing AND there's no authorLookup, we can't create one.
  if (data.userId) {
    const lookupEntry = { uid: data.userId, type };
    if (type === "reply" && context.postId) {
      lookupEntry.postId = context.postId;
    } else if (type === "subreply" && context.postId && context.replyId) {
      lookupEntry.postId = context.postId;
      lookupEntry.replyId = context.replyId;
    }

    updates[`authorLookup/${id}`] = lookupEntry;
    stats.lookupCreated++;
    touched = true;

    // Also ensure the user receipt exists
    if (type === "post") {
      updates[`users/${data.userId}/posts/${id}`] = true;
    } else if (type === "reply" && context.postId) {
      updates[`users/${data.userId}/replies/${context.postId}/${id}`] = true;
    } else if (type === "subreply" && context.postId && context.replyId) {
      updates[
        `users/${data.userId}/subreplies/${context.postId}/${context.replyId}/${id}`
      ] = true;
    }
  }

  // 2. Strip legacy fields from the content node
  const contentPath =
    type === "post"
      ? `posts/${id}`
      : type === "reply"
        ? `replies/${context.postId}/${id}`
        : `subreplies/${context.postId}/${context.replyId}/${id}`;

  for (const field of LEGACY_FIELDS_TO_STRIP) {
    if (data[field] !== undefined) {
      updates[`${contentPath}/${field}`] = null;
      stats.fieldsStripped++;
      touched = true;
    }
  }

  // 3. Backfill authorDisplay if missing (assume all legacy posts are anonymous)
  if (!data.authorDisplay) {
    updates[`${contentPath}/authorDisplay`] = "Anonymous User";
    stats.displayBackfilled++;
    touched = true;
  }

  if (!touched) {
    stats.alreadyClean++;
  }

  return updates;
}

// --- Main migration ----------------------------------------------------------

async function migrate() {
  console.log("Starting authorLookup migration...");
  console.log(
    `   Mode: ${DRY_RUN ? "DRY RUN (pass --commit to write)" : "LIVE COMMIT"}`,
  );
  console.log(`   Database: ${DATABASE_URL}`);
  console.log("");

  const allUpdates = {};

  try {
    // ---- Posts ----
    console.log("Fetching posts...");
    const postsSnap = await db.ref("posts").once("value");
    postsSnap.forEach((snap) => {
      const id = snap.key;
      const data = snap.val();
      stats.postsScanned++;

      if (!data || typeof data !== "object") return;

      const updates = processNode(id, data, "post");
      Object.assign(allUpdates, updates);
    });
    console.log(`   Scanned ${stats.postsScanned} posts`);

    // ---- Replies ----
    console.log("Fetching replies...");
    const repliesSnap = await db.ref("replies").once("value");
    repliesSnap.forEach((parentSnap) => {
      const postId = parentSnap.key;
      parentSnap.forEach((replySnap) => {
        const replyId = replySnap.key;
        const data = replySnap.val();
        stats.repliesScanned++;

        if (!data || typeof data !== "object") return;

        const updates = processNode(replyId, data, "reply", { postId });
        Object.assign(allUpdates, updates);
      });
    });
    console.log(`   Scanned ${stats.repliesScanned} replies`);

    // ---- Sub-Replies ----
    console.log("Fetching subreplies...");
    const subRepliesSnap = await db.ref("subreplies").once("value");
    if (subRepliesSnap.exists()) {
      subRepliesSnap.forEach((postSnap) => {
        const postId = postSnap.key;
        postSnap.forEach((replySnap) => {
          const replyId = replySnap.key;
          replySnap.forEach((subSnap) => {
            const subId = subSnap.key;
            const data = subSnap.val();
            stats.subRepliesScanned++;

            if (!data || typeof data !== "object") return;

            const updates = processNode(subId, data, "subreply", {
              postId,
              replyId,
            });
            Object.assign(allUpdates, updates);
          });
        });
      });
    }
    console.log(`   Scanned ${stats.subRepliesScanned} subreplies`);

    // ---- Check existing authorLookup for orphaned entries ----
    console.log("Checking existing authorLookup for orphans...");
    const lookupSnap = await db.ref("authorLookup").once("value");
    if (lookupSnap.exists()) {
      const existingLookups = lookupSnap.val();
      for (const [id, meta] of Object.entries(existingLookups)) {
        // Skip entries we're about to create/overwrite
        if (allUpdates[`authorLookup/${id}`]) continue;

        // Check if the content still exists
        let contentPath;
        if (meta.type === "post") contentPath = `posts/${id}`;
        else if (meta.type === "reply")
          contentPath = `replies/${meta.postId}/${id}`;
        else if (meta.type === "subreply")
          contentPath = `subreplies/${meta.postId}/${meta.replyId}/${id}`;

        if (contentPath) {
          const exists = await db.ref(contentPath).once("value");
          if (!exists.exists()) {
            console.warn(
              `   [WARNING] Orphaned authorLookup/${id} (content missing)`,
            );
            allUpdates[`authorLookup/${id}`] = null;
            stats.orphaned++;
          }
        }
      }
    }

    // ---- Summary ----
    const updateCount = Object.keys(allUpdates).length;
    console.log("");
    console.log("Migration Summary:");
    console.log(`   Posts scanned:              ${stats.postsScanned}`);
    console.log(`   Replies scanned:            ${stats.repliesScanned}`);
    console.log(`   Sub-replies scanned:        ${stats.subRepliesScanned}`);
    console.log(`   Lookup entries to create:   ${stats.lookupCreated}`);
    console.log(`   Legacy fields to strip:     ${stats.fieldsStripped}`);
    console.log(`   authorDisplay backfilled:   ${stats.displayBackfilled}`);
    console.log(`   Already clean:              ${stats.alreadyClean}`);
    console.log(`   Orphaned lookups to remove: ${stats.orphaned}`);
    console.log(`   Total DB updates:           ${updateCount}`);
    console.log("");

    if (updateCount === 0) {
      console.log("Database is already fully migrated. Nothing to do.");
      return;
    }

    // ---- Preview ----
    if (DRY_RUN) {
      console.log("Planned updates (first 50):");
      const entries = Object.entries(allUpdates);
      entries.slice(0, 50).forEach(([path, value]) => {
        if (value === null) {
          console.log(`   DELETE  ${path}`);
        } else if (typeof value === "object") {
          console.log(`   SET     ${path} = ${JSON.stringify(value)}`);
        } else {
          console.log(`   SET     ${path} = ${value}`);
        }
      });
      if (entries.length > 50) {
        console.log(`   ... and ${entries.length - 50} more`);
      }
      console.log("");
      console.log("This was a DRY RUN. Run with --commit to apply changes.");
      return;
    }

    // ---- Commit ----
    // Firebase multi-path updates are limited to ~10k paths.
    // If we have more, batch them.
    const BATCH_SIZE = 5000;
    const entries = Object.entries(allUpdates);

    if (entries.length <= BATCH_SIZE) {
      console.log("Writing all updates in a single batch...");
      await db.ref().update(allUpdates);
    } else {
      const totalBatches = Math.ceil(entries.length / BATCH_SIZE);
      for (let i = 0; i < entries.length; i += BATCH_SIZE) {
        const batch = Object.fromEntries(entries.slice(i, i + BATCH_SIZE));
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        console.log(
          `Writing batch ${batchNum}/${totalBatches} (${Object.keys(batch).length} updates)...`,
        );
        await db.ref().update(batch);
        // Breathe between batches
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit();
  }
}

migrate();
