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
 * updates interaction counts (agreed/dissented).
 * transactions ensure we don't accidentally recreate a deleted post.
 */
export const updateInteractionCounts = onValueWritten(
  "/posts/{postId}/userInteractions/{interactionType}/{userId}",
  async (event) => {
    const { postId, interactionType } = event.params;

    const metricMapping: Record<string, string> = {
      agreed: "agreedCount",
      dissented: "dissentedCount",
    };

    const counterKey = metricMapping[interactionType];
    if (!counterKey) return;

    const before = event.data.before.exists();
    const after = event.data.after.exists();

    let incrementValue = 0;
    if (after && !before) incrementValue = 1;
    else if (!after && before) incrementValue = -1;
    else return;

    const postRef = admin.database().ref(`/posts/${postId}`);

    return postRef.transaction((currentData) => {
      if (currentData === null) return; // abort if post was deleted
      if (!currentData.metrics) {
        currentData.metrics = {
          agreedCount: 0,
          dissentedCount: 0,
          replyCount: 0,
        };
      }
      const currentCount = currentData.metrics[counterKey] || 0;
      currentData.metrics[counterKey] = Math.max(
        0,
        currentCount + incrementValue,
      );
      return currentData;
    });
  },
);

/**
 * syncs user interactions from the user's private tree to the public post tree.
 */
export const syncInteractionToPost = onValueWritten(
  "/users/{userId}/postInteractions/{interactionType}/{postId}",
  async (event) => {
    const { userId, interactionType, postId } = event.params;
    const exists = event.data.after.exists();

    const targetPath = `/posts/${postId}/userInteractions/${interactionType}/${userId}`;

    // this write triggers existing 'updateInteractionCounts' function
    return admin
      .database()
      .ref(targetPath)
      .set(exists ? true : null);
  },
);

/**
 * updates the replyCount on the parent post.
 * listens to the dedicated /replies/ tree for changes.
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

    const postRef = admin.database().ref(`/posts/${postId}`);

    return postRef.transaction((currentData) => {
      if (currentData === null) return; // abort if parent was deleted
      if (!currentData.metrics) {
        currentData.metrics = {
          replyCount: 0,
          agreedCount: 0,
          dissentedCount: 0,
        };
      }
      const currentCount = currentData.metrics.replyCount || 0;
      currentData.metrics.replyCount = Math.max(
        0,
        currentCount + incrementValue,
      );
      return currentData;
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

export const beforesignedin = beforeUserSignedIn((event) => {
  uclaOnlyAuth(event);
});
