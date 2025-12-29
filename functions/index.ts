require("firebase-functions/logger/compat");
import { onValueWritten } from "firebase-functions/v2/database";
import { HttpsError } from "firebase-functions/v2/https";
import {
  AuthBlockingEvent,
  beforeUserCreated,
  // beforeUserSignedIn,
} from "firebase-functions/v2/identity";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * syncs user interactions from the user's private tree to the public post or reply tree.
 * data value in user tree is now the parentPostId string or "top".
 */
export const syncInteractionToPost = onValueWritten(
  "/users/{userId}/postInteractions/{interactionType}/{postId}",
  async (event) => {
    const { userId, interactionType, postId } = event.params;
    const afterValue = event.data.after.val();
    const beforeValue = event.data.before.val();
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

    // replyCount is now a top-level field on the post
    const postRef = admin.database().ref(`/posts/${postId}/replyCount`);

    return postRef.transaction((currentCount) => {
      return Math.max(0, (currentCount || 0) + incrementValue);
    });
  },
);

const uclaOnlyAuth = (event: AuthBlockingEvent): void => {
  const user = event.data;
  if (!user?.email?.endsWith("@g.ucla.edu")) {
    throw new HttpsError(
      "invalid-argument",
      "Only @g.ucla.edu emails are allowed.",
    );
  }
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

// export const beforesignedin = beforeUserSignedIn((event) => {
//   uclaOnlyAuth(event);
// });

/**
 * Clean up user interaction references when a post is deleted.
 */
export const onPostDeletedCleanup = onValueWritten(
  "/posts/{postId}",
  async (event) => {
    if (event.data.after.exists() || !event.data.before.exists()) return;

    const postData = event.data.before.val();
    const postId = event.params.postId;
    const interactions = postData.userInteractions;

    if (!interactions) return;

    const updates: Record<string, any> = {};

    // map through agreed users
    if (interactions.agreed) {
      Object.keys(interactions.agreed).forEach((uid) => {
        updates[`users/${uid}/postInteractions/agreed/${postId}`] = null;
      });
    }

    // map through dissented users
    if (interactions.dissented) {
      Object.keys(interactions.dissented).forEach((uid) => {
        updates[`users/${uid}/postInteractions/dissented/${postId}`] = null;
      });
    }

    if (Object.keys(updates).length === 0) return;
    return admin.database().ref().update(updates);
  },
);
