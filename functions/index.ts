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
 * Dynamically updates interaction counters.
 * Triggers on any change in the userInteractions path.
 */
export const updateInteractionCounts = onValueWritten(
  "/posts/{postId}/userInteractions/{interaction}/{userId}",
  async (event) => {
    const { postId, interaction } = event.params;

    // quick validation for interaction types
    const validInteractions = ["agreed", "disagreed", "interested"];
    if (!validInteractions.includes(interaction)) {
      return;
    }

    const isCreation = event.data.after.exists() && !event.data.before.exists();
    const isDeletion = !event.data.after.exists() && event.data.before.exists();

    let incrementValue = 0;
    if (isCreation) {
      incrementValue = 1;
    } else if (isDeletion) {
      incrementValue = -1;
    } else {
      // nothing to do (e.g. data was updated but not created/deleted)
      return;
    }

    const counterRef = admin
      .database()
      .ref(`/posts/${postId}/metrics/${interaction}Count`);

    // bypass extra reads and use the atomic server increment
    return counterRef.set(admin.database.ServerValue.increment(incrementValue));
  },
);

// ucla auth restrictions
const uclaOnlyAuth = (event: AuthBlockingEvent): void => {
  const user = event.data;
  if (!user?.email?.endsWith("@g.ucla.edu")) {
    throw new HttpsError(
      "invalid-argument",
      "Sorry, only @ucla.edu emails are allowed to sign up.",
    );
  }
};

export const beforecreated = beforeUserCreated(async (event) => {
  uclaOnlyAuth(event);
  const user = event.data;

  const newUserProfile = {
    email: user?.email,
    displayName: user?.displayName,
  };

  // create root path for user
  const userRef = admin.database().ref(`users/${user?.uid}`);
  await userRef.set(newUserProfile);
});

export const beforesignedin = beforeUserSignedIn((event) => {
  return uclaOnlyAuth(event);
});
