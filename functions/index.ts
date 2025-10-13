import { onValueWritten } from "firebase-functions/v2/database";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Dynamically updates interaction counters on the client side using atomic
 * increment operation. Triggers on any change in the userInteractions path that
 * exists for all posts.
 */
export const updateInteractionCounts = onValueWritten(
  "/posts/{postId}/userInteractions/{interaction}/{userId}", // use wildcard for postID, interaction, userID (allow any child)
  (event) => {
    const { postId, interaction } = event.params; // extract actual postID and interaction

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
