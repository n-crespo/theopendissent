// `firebase deploy --only functions`
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
 * triggers on any change in the userInteractions path.
 */
export const updateInteractionCounts = onValueWritten(
  "/posts/{postId}/userInteractions/{interactionType}/{userId}",
  async (event) => {
    const { postId, interactionType } = event.params;

    // map the userInteractions key to the metrics key
    const metricMapping: Record<string, string> = {
      agreed: "agreedCount",
      disagreed: "disagreedCount",
      interested: "interestedCount",
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
