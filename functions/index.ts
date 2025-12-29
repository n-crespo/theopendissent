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

export const syncInteractionToPost = onValueWritten(
  "/users/{userId}/postInteractions/{interactionType}/{postId}",
  async (event) => {
    const { userId, interactionType, postId } = event.params;
    const interactionData = event.data.after.val(); // contains { parentPostId }
    const exists = event.data.after.exists();
    const db = admin.database();

    // Determine the root path (Post vs Reply)
    let rootPath: string;
    if (
      interactionData?.parentPostId &&
      interactionData.parentPostId !== "top"
    ) {
      // It's a reply
      rootPath = `replies/${interactionData.parentPostId}/${postId}`;
    } else {
      // It's a top-level post
      rootPath = `posts/${postId}`;
    }

    const metricMapping: Record<string, string> = {
      agreed: "agreedCount",
      dissented: "dissentedCount",
    };
    const counterKey = metricMapping[interactionType];
    const incrementValue = exists ? 1 : -1;

    return db.ref(rootPath).transaction((currentData) => {
      if (currentData === null) return; // abort if content was deleted

      // update userInteractions object
      if (!currentData.userInteractions) currentData.userInteractions = {};
      if (!currentData.userInteractions[interactionType]) {
        currentData.userInteractions[interactionType] = {};
      }

      if (exists) {
        currentData.userInteractions[interactionType][userId] = true;
      } else {
        if (currentData.userInteractions[interactionType]) {
          delete currentData.userInteractions[interactionType][userId];
        }
      }

      // update metric interaction counts
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

/**
 * Clean up user interaction references when a post is deleted.
 */
export const onPostDeletedCleanup = onValueWritten(
  "/posts/{postId}",
  async (event) => {
    // only run if the data was deleted (before exists, after doesn't)
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
