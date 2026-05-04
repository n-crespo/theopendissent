import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  RulesTestEnvironment,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { wipeUserData } from "../functions/index.js";

const PROJECT_ID = "the-open-dissent-prod";
const DB_NAME = "the-open-dissent-prod-default-rtdb";

let testEnv: RulesTestEnvironment;

describe("Account Deletion Logic (wipeUserData)", () => {
  beforeAll(async () => {
    const rules = readFileSync(
      resolve(process.cwd(), "database.rules.json"),
      "utf8",
    );
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      database: { host: "127.0.0.1", port: 9000, rules },
    });
  });

  afterAll(async () => {
    if (testEnv) await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearDatabase();
  });

  it("wipes all user data completely based on their profile indexes", async () => {
    const uid = "delete_me_user";
    const postId = "my_post_1";
    const replyId = "my_reply_1";
    const subReplyId = "my_subreply_1";

    // 1. Seed the database with Admin privileges (rules disabled)
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.database(`http://127.0.0.1:9000?ns=${DB_NAME}`);
      
      const seedData = {
        // User's root profile
        [`users/${uid}/posts/${postId}`]: true,
        [`users/${uid}/replies/some_other_post/${replyId}`]: true,
        [`users/${uid}/subreplies/some_other_post/some_other_reply/${subReplyId}`]: true,
        [`users/${uid}/notifications/notif_1`]: { type: "reply" },

        // The actual content
        [`posts/${postId}`]: { postContent: "Hello world" },
        [`replies/some_other_post/${replyId}`]: { postContent: "My reply" },
        [`subreplies/some_other_post/some_other_reply/${subReplyId}`]: { postContent: "My subreply" },
      };

      await db.ref("/").update(seedData);
    });

    // 2. Call the wipeUserData function (using an admin context mock)
    await testEnv.withSecurityRulesDisabled(async (context) => {
      // Cast the test context database to any to bypass strict admin types
      const mockAdminDb = context.database(`http://127.0.0.1:9000?ns=${DB_NAME}`) as any;
      await wipeUserData(uid, mockAdminDb);
    });

    // 3. Verify the data is completely gone
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.database(`http://127.0.0.1:9000?ns=${DB_NAME}`);
      
      const userSnap = await db.ref(`users/${uid}`).once("value");
      expect(userSnap.exists()).toBe(false);

      const postSnap = await db.ref(`posts/${postId}`).once("value");
      expect(postSnap.exists()).toBe(false);

      const replySnap = await db.ref(`replies/some_other_post/${replyId}`).once("value");
      expect(replySnap.exists()).toBe(false);

      const subReplySnap = await db.ref(`subreplies/some_other_post/some_other_reply/${subReplyId}`).once("value");
      expect(subReplySnap.exists()).toBe(false);
    });
  });

  it("does nothing if the user does not exist", async () => {
    // Should safely execute without errors
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const mockAdminDb = context.database(`http://127.0.0.1:9000?ns=${DB_NAME}`) as any;
      await wipeUserData("ghost_user", mockAdminDb);
    });
  });

  it("anonymizes content if deletionSettings.deleteContent is false", async () => {
    const uid = "anon_user";
    const postId = "anon_post_1";

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.database(`http://127.0.0.1:9000?ns=${DB_NAME}`);
      
      const seedData = {
        [`users/${uid}/email`]: "test@test.com",
        [`users/${uid}/displayName`]: "Real Name",
        [`users/${uid}/deletionSettings/deleteContent`]: false,
        [`users/${uid}/posts/${postId}`]: true,
        [`posts/${postId}`]: { postContent: "Hello world", authorDisplay: "Real Name" },
      };

      await db.ref("/").update(seedData);
    });

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const mockAdminDb = context.database(`http://127.0.0.1:9000?ns=${DB_NAME}`) as any;
      await wipeUserData(uid, mockAdminDb);
    });

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.database(`http://127.0.0.1:9000?ns=${DB_NAME}`);
      
      const userSnap = await db.ref(`users/${uid}`).once("value");
      expect(userSnap.exists()).toBe(true);
      expect(userSnap.val().email).toBeUndefined(); // or null, but JS val() skips nulls
      expect(userSnap.val().displayName).toBe("[Deleted User]");
      expect(userSnap.val().deletionSettings).toBeUndefined();

      const postSnap = await db.ref(`posts/${postId}`).once("value");
      expect(postSnap.exists()).toBe(true);
      expect(postSnap.val().authorDisplay).toBe("[Deleted User]");
    });
  });
});
