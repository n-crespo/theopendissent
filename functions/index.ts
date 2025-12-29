require("firebase-functions/logger/compat");
import { onValueWritten } from "firebase-functions/v2/database";
import { HttpsError } from "firebase-functions/v2/https";
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
