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
 * Dynamically updates interaction counters on the client side using atomic
 * increment operation. Triggers on any change in the userInteractions path that
 * exists for all posts.
 */
export const updateInteractionCounts = onValueWritten(
  // use wildcard for postID, interaction, userID (allow any child)
  "/posts/{postId}/userInteractions/{interaction}/{userId}",
  (event) => {
    //
    // extract actual postID and interaction
    const { postId, interaction } = event.params;

    // ensure we only do this for valid interactions
    const validInteractions = ["agreed", "disagreed", "interested"];
    if (!validInteractions.includes(interaction)) {
      console.log(`Ignoring invalid interaction type: "${interaction}"`);
      return;
    }

    const isCreation = event.data.after.exists() && !event.data.before.exists();
    const isDeletion = !event.data.after.exists() && event.data.before.exists();

    let incrementValue = 0;
    if (isCreation) {
      // an interaction was added
      incrementValue = 1;
    } else if (isDeletion) {
      // an interaction was removed
      incrementValue = -1;
    } else {
      return; // no change was made to the children we are watching
    }

    // Dynamically build the path to the correct counter.
    const counterRef = admin
      .database()
      .ref(`/posts/${postId}/metrics/${interaction}Count`);
    console.log(
      `Updating ${interaction}Count for post ${postId} by ${incrementValue}.`,
    );

    // use the atomic increment operation to avoid race condition
    return counterRef.set(admin.database.ServerValue.increment(incrementValue));
  },
);

// restrict users to @g.ucla.edu emails
const uclaOnlyAuth = (event: AuthBlockingEvent): void => {
  const user = event.data;
  // example from docs https://firebase.google.com/docs/auth/extend-with-blocking-functions?authuser=0#only_allowing_registration_from_a_specific_domain
  if (!user?.email?.endsWith("@g.ucla.edu")) {
    throw new HttpsError(
      "invalid-argument",
      "Sorry, only @ucla.edu emails are allowed to sign up.",
    );
  }
};

// run on user creation
export const beforecreated = beforeUserCreated(async (event) => {
  uclaOnlyAuth(event);
  const user = event.data;

  // add new user to db
  const newUserProfile = {
    email: user?.email,
    displayName: user?.displayName,
  };
  const userRef = admin.database().ref(`users/${user?.uid}`);
  console.log(`Validation passed. Creating profile for new user: ${user?.uid}`);

  await userRef.set(newUserProfile);
});

// run on user sign-in
export const beforesignedin = beforeUserSignedIn((event) => {
  return uclaOnlyAuth(event);
});
