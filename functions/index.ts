// to update, run `firebase deploy --only functions`
// for the db rules json, run `firebase deploy --only database`
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
 * dynamically updates interaction counters.
 * handles 'agreed' and 'dissented'.
 */
export const updateInteractionCounts = onValueWritten(
  "/posts/{postId}/userInteractions/{interactionType}/{userId}",
  async (event) => {
    const { postId, interactionType } = event.params;

    // verify the post actually exists so we don't create "ghost" metrics
    const postRef = admin.database().ref(`/posts/${postId}`);
    const postSnapshot = await postRef.child("userId").once("value");
    if (!postSnapshot.exists()) return;

    const metricMapping: Record<string, string> = {
      agreed: "agreedCount",
      dissented: "dissentedCount",
    };

    const counterKey = metricMapping[interactionType];
    if (!counterKey) return;

    const before = event.data.before.exists();
    const after = event.data.after.exists();

    let incrementValue = 0;
    if (after && !before) {
      incrementValue = 1;
    } else if (!after && before) {
      incrementValue = -1;
    } else {
      return;
    }

    const counterRef = admin
      .database()
      .ref(`/posts/${postId}/metrics/${counterKey}`);

    return counterRef.set(admin.database.ServerValue.increment(incrementValue));
  },
);

/**
 * updates the replyCount on the parent post when a reply is created or deleted.
 */
export const updateReplyCount = onValueWritten(
  "/replies/{postId}/{replyId}",
  async (event) => {
    const { postId } = event.params;
    const before = event.data.before.exists();
    const after = event.data.after.exists();

    let incrementValue = 0;
    if (after && !before) {
      incrementValue = 1;
    } else if (!after && before) {
      incrementValue = -1;
    } else {
      return;
    }

    const counterRef = admin
      .database()
      .ref(`/posts/${postId}/metrics/replyCount`);

    return counterRef.set(admin.database.ServerValue.increment(incrementValue));
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
    // we don't initialize 'posts' or 'replies' here because
    // empty nodes don't exist in Firebase Realtime DB
  };

  await admin.database().ref(`users/${user?.uid}`).set(newUserProfile);
});

export const beforesignedin = beforeUserSignedIn((event) => {
  uclaOnlyAuth(event);
});

/**
 * cleans up user-specific indexes and replies when a post is deleted
 */
export const onPostDeleted = onValueWritten(
  "/posts/{postId}",
  async (event) => {
    // only run if the post was deleted (before exists, after doesn't)
    if (event.data.after.exists() || !event.data.before.exists()) return;

    const postId = event.params.postId;
    const postData = event.data.before.val();
    const authorId = postData.userId;

    const updates: Record<string, any> = {
      // remove from author's list
      [`users/${authorId}/posts/${postId}`]: null,
      // remove all replies associated with this post
      [`replies/${postId}`]: null,
    };

    return admin.database().ref().update(updates);
  },
);
