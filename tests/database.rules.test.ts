import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  RulesTestEnvironment,
  RulesTestContext,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";

const PROJECT_ID = "the-open-dissent-prod";
const DB_NAME = "the-open-dissent-prod-default-rtdb";

const uidA = "user_a";
const uidB = "user_b";
const postId = "post_1";
const replyId = "reply_1";

let testEnv: RulesTestEnvironment;

const dbFromContext = (context: RulesTestContext) =>
  context.database(`http://127.0.0.1:9000?ns=${DB_NAME}`);

const authedDb = (uid: string) =>
  dbFromContext(testEnv.authenticatedContext(uid));

const anonDb = () => dbFromContext(testEnv.unauthenticatedContext());

const dbGet = (db: ReturnType<typeof authedDb>, path: string) =>
  db.ref(path).once("value");
const dbSet = (db: ReturnType<typeof authedDb>, path: string, value: unknown) =>
  db.ref(path).set(value);
const dbUpdate = (
  db: ReturnType<typeof authedDb>,
  path: string,
  value: Record<string, unknown>,
) => db.ref(path).update(value);
const dbRemove = (db: ReturnType<typeof authedDb>, path: string) =>
  db.ref(path).remove();

describe("Realtime Database rules", () => {
  beforeAll(async () => {
    const rules = readFileSync(
      resolve(process.cwd(), "database.rules.json"),
      "utf8",
    );

    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      database: {
        host: "127.0.0.1",
        port: 9000,
        rules,
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearDatabase();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = dbFromContext(context);
      await dbUpdate(db, "/", {
        [`posts/${postId}`]: {
          postContent: "seed post",
          timestamp: Date.now(),
          replyCount: 0,
          userId: uidA,
          userInteractions: {},
        },
        [`users/${uidA}/posts/${postId}`]: true,
      });
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  describe("Public + Legacy Read Access", () => {
    // public access
    it("allow public reads to posts/replies", async () => {
      const db = anonDb();
      await assertSucceeds(dbGet(db, `posts/${postId}`));
    });

    // legacy compatibility
    it("legacy post shape still reads correctly (no authorDisplay/isThreadAuthor)", async () => {
      const db = anonDb();
      const snap = await assertSucceeds(dbGet(db, `posts/${postId}`));
      expect(snap.exists()).toBe(true);
      expect(snap.child("postContent").val()).toBe("seed post");
      expect(snap.child("userId").val()).toBe(uidA);
    });

    // data security
    it("public post data contains only userId and not private metadata", async () => {
      const db = anonDb();
      const snap = await dbGet(db, `posts/${postId}`);
      expect(snap.child("userId").exists()).toBe(true);
      expect(snap.child("notifications").exists()).toBe(false);
    });
  });

  describe("Unauthorized Reads", () => {
    // unauthorized access
    it("denies unauthorized access to root users list (preventing ID scraping)", async () => {
      const dbAnon = anonDb();
      const dbB = authedDb(uidB);
      await assertFails(dbGet(dbAnon, "users"));
      await assertFails(dbGet(dbB, "users"));
    });

    // unauthorized access
    it("denies anonymous access to a user's private profile data", async () => {
      const dbAnon = anonDb();
      await assertFails(dbGet(dbAnon, `users/${uidA}`));
    });

    it("denies anonymous access to a user's posts", async () => {
      const dbAnon = anonDb();
      await assertFails(dbGet(dbAnon, `users/${uidA}/posts`));
    });

    it("denies anonymous access to a user's replies", async () => {
      const dbAnon = anonDb();
      await assertFails(dbGet(dbAnon, `users/${uidA}/replies`));
    });

    it("denies anonymous access to a user's notifications", async () => {
      const dbAnon = anonDb();
      await assertFails(dbGet(dbAnon, `users/${uidA}/notifications`));
    });

    it("denies anonymous access to a user's displayName", async () => {
      const dbAnon = anonDb();
      await assertFails(dbGet(dbAnon, `users/${uidA}/displayName`));
    });

    it("denies anonymous access to a user's email", async () => {
      const dbAnon = anonDb();
      await assertFails(dbGet(dbAnon, `users/${uidA}/email`));
    });

    it("denies anonymous access to a user's postInteractions (legacy field)", async () => {
      const dbAnon = anonDb();
      await assertFails(dbGet(dbAnon, `users/${uidA}/postInteractions`));
    });

    it("denies other user access to a user's posts", async () => {
      const dbB = authedDb(uidB);
      await assertFails(dbGet(dbB, `users/${uidA}/posts`));
    });

    it("denies other user access to a user's replies", async () => {
      const dbB = authedDb(uidB);
      await assertFails(dbGet(dbB, `users/${uidA}/replies`));
    });

    it("denies other user access to a user's notifications", async () => {
      const dbB = authedDb(uidB);
      await assertFails(dbGet(dbB, `users/${uidA}/notifications`));
    });

    it("denies other user access to a user's displayName", async () => {
      const dbB = authedDb(uidB);
      await assertFails(dbGet(dbB, `users/${uidA}/displayName`));
    });

    it("denies other user access to a user's email", async () => {
      const dbB = authedDb(uidB);
      await assertFails(dbGet(dbB, `users/${uidA}/email`));
    });

    it("denies other user access to a user's postInteractions (legacy field)", async () => {
      const dbB = authedDb(uidB);
      await assertFails(dbGet(dbB, `users/${uidA}/postInteractions`));
    });
  });

  describe("Unauthorized Writes", () => {
    it("denies unauthenticated user post creation", async () => {
      const db = anonDb();
      await assertFails(
        dbSet(db, "posts/post_x", {
          postContent: "anon write",
          timestamp: Date.now(),
          replyCount: 0,
        }),
      );
    });

    it("denies users from writing to another user's profile/index", async () => {
      const dbB = authedDb(uidB);
      await assertFails(dbSet(dbB, `users/${uidA}/posts/evil`, true));
    });

    it("denies any user from writing to reply count", async () => {
      const dbA = authedDb(uidA);
      const dbB = authedDb(uidB);

      // this is the author
      await assertFails(dbSet(dbA, `posts/${postId}/replyCount`, 999));
      // this is a random user
      await assertFails(dbSet(dbB, `posts/${postId}/replyCount`, 123));
    });
  });

  describe("Authorized Read + Write", () => {
    it("allows users to read/write their own users tree", async () => {
      const dbA = authedDb(uidA);
      await assertSucceeds(
        dbSet(dbA, `users/${uidA}/notifications/test`, {
          type: "reply",
          isRead: false,
          updatedAt: Date.now(),
        }),
      );
      await assertSucceeds(dbGet(dbA, `users/${uidA}`));
    });
  });

  describe("Anonymous Post Creation + Deletion", () => {
    it("denies creating a anonymous post without linking to users/", async () => {
      const dbA = authedDb(uidA);
      const anonPostId = "anon_post_123";

      await assertFails(
        dbUpdate(dbA, "/", {
          [`posts/${anonPostId}`]: {
            id: anonPostId,
            postContent: "this is anonymous",
            timestamp: { ".sv": "timestamp" },
            replyCount: 0,
            // userId is omitted here for anonymity
          },
          // no write to users/
        }),
      );
    });

    it("allows creating a post without a public userId (Anonymous Post)", async () => {
      const dbA = authedDb(uidA);
      const anonPostId = "anon_post_123";

      await assertSucceeds(
        dbUpdate(dbA, "/", {
          [`posts/${anonPostId}`]: {
            id: anonPostId,
            postContent: "this is anonymous",
            timestamp: { ".sv": "timestamp" },
            replyCount: 0,
            // userId is omitted here for anonymity
          },
          [`users/${uidA}/posts/${anonPostId}`]: true,
        }),
      );
    });

    it("allows deleting a post created anonymously", async () => {
      const dbA = authedDb(uidA);
      const anonPostId = "anon_to_delete";

      // seed an anonymous post with no userId field, but indexed for user_a
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = dbFromContext(context);
        await dbUpdate(db, "/", {
          [`posts/${anonPostId}`]: {
            postContent: "hidden author",
            timestamp: Date.now(),
            replyCount: 0,
          },
          [`users/${uidA}/posts/${anonPostId}`]: true,
        });
      });

      // note that both paths must be deleted together
      await assertSucceeds(
        dbUpdate(dbA, "/", {
          [`posts/${anonPostId}`]: null,
          [`users/${uidA}/posts/${anonPostId}`]: null,
        }),
      );
    });
  });

  describe("Non-Anonymous Post Creation + Deletion", () => {
    it("allows creating a post with required fields (legacy format)", async () => {
      const dbA = authedDb(uidA);
      const newPost = "post_new";
      await assertSucceeds(
        dbUpdate(dbA, "/", {
          [`posts/${newPost}`]: {
            id: newPost,
            userId: uidA,
            postContent: "hello world",
            timestamp: { ".sv": "timestamp" },
            replyCount: 0,
          },
          [`users/${uidA}/posts/${newPost}`]: true, // this is REQUIRED
        }),
      );
    });

    it("denies post creation with mismatched userId linkage", async () => {
      const dbA = authedDb(uidA);
      const newPost = "post_wrong_uid";
      await assertFails(
        dbUpdate(dbA, "/", {
          [`posts/${newPost}`]: {
            id: newPost,
            userId: uidB,
            postContent: "wrong userId",
            timestamp: { ".sv": "timestamp" },
            replyCount: 0,
          },
          [`users/${uidA}/posts/${newPost}`]: true,
        }),
      );
    });

    it("denies post creation when required fields are missing", async () => {
      const dbA = authedDb(uidA);
      const newPost = "post_missing_fields";
      await assertFails(
        dbUpdate(dbA, "/", {
          [`posts/${newPost}`]: {
            id: newPost,
            userId: uidA,
            postContent: "missing fields",
            // missing timestamp, reply count
          },
          [`users/${uidA}/posts/${newPost}`]: true,
        }),
      );
    });

    it("allows deleting a post created non-anonymously", async () => {
      const dbA = authedDb(uidA);
      const nonAnonPostId = "non-anonymous-user";

      // seed an anonymous post with no userId field, but indexed for user_a
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = dbFromContext(context);
        await dbUpdate(db, "/", {
          [`posts/${nonAnonPostId}`]: {
            userId: nonAnonPostId,
            postContent: "not anonymous!",
            timestamp: Date.now(),
            replyCount: 0,
          },
          [`users/${uidA}/posts/${nonAnonPostId}`]: true,
        });
      });

      // note that both paths must be deleted together
      await assertSucceeds(
        dbUpdate(dbA, "/", {
          [`posts/${nonAnonPostId}`]: null,
          [`users/${uidA}/posts/${nonAnonPostId}`]: null,
        }),
      );
    });

    it("denies post creation if content exceeds 600 chars", async () => {
      const dbA = authedDb(uidA);
      const newPost = "post_too_long";
      await assertFails(
        dbUpdate(dbA, "/", {
          [`posts/${newPost}`]: {
            id: newPost,
            userId: uidA,
            postContent: "x".repeat(601),
            timestamp: { ".sv": "timestamp" },
            replyCount: 0,
          },
          [`users/${uidA}/posts/${newPost}`]: true,
        }),
      );
    });
  });

  describe("General Reply Validation", () => {
    it("denies reply with out-of-range interactionScore", async () => {
      const dbA = authedDb(uidA);
      const outOfRangeReply = "reply_out_of_range";
      await assertFails(
        dbUpdate(dbA, "/", {
          [`replies/${postId}/${outOfRangeReply}`]: {
            id: outOfRangeReply,
            userId: uidA,
            postContent: "bad score",
            timestamp: { ".sv": "timestamp" },
            replyCount: 0,
            parentPostId: postId,
            interactionScore: 7,
          },
        }),
      );
    });

    it("denies reply if userId doesn't match auth.uid", async () => {
      const dbA = authedDb(uidA);
      const wrongUidReply = "reply_wrong_uid";
      await assertFails(
        dbUpdate(dbA, "/", {
          [`replies/${postId}/${wrongUidReply}`]: {
            id: wrongUidReply,
            userId: uidB,
            postContent: "wrong uid",
            timestamp: { ".sv": "timestamp" },
            replyCount: 0,
            parentPostId: postId,
            interactionScore: 1,
          },
        }),
      );
    });

    it("denies owner reply if content exceeds 600 chars", async () => {
      const dbA = authedDb(uidA);
      const longReply = "reply_too_long";
      await assertFails(
        dbUpdate(dbA, "/", {
          [`replies/${postId}/${longReply}`]: {
            id: longReply,
            userId: uidA,
            postContent: "x".repeat(601),
            timestamp: { ".sv": "timestamp" },
            replyCount: 0,
            parentPostId: postId,
            interactionScore: 1,
          },
        }),
      );
    });
  });

  describe("Anonymous Reply Creation + Deletion", () => {
    it("denies creating a anonymous reply without interaction score", async () => {
      const dbA = authedDb(uidA);
      const anonPostId = "anon_post_123";

      await assertFails(
        dbUpdate(dbA, "/", {
          [`replies/${postId}/${anonPostId}`]: {
            id: anonPostId,
            // userId is omitted here for anonymity
            postContent: "this is anonymous",
            timestamp: { ".sv": "timestamp" },
            replyCount: 0,
            parentPostId: postId,
            // interactionScore: 2,
          },
          [`users/${uidA}/replies/${postId}/${anonPostId}`]: true,
        }),
      );
    });

    it("denies creating a anonymous reply without linking to users/", async () => {
      const dbA = authedDb(uidA);
      const anonPostId = "anon_post_123";

      await assertFails(
        dbUpdate(dbA, "/", {
          [`replies/${postId}/${anonPostId}`]: {
            id: anonPostId,
            // userId is omitted here for anonymity
            postContent: "this is anonymous",
            timestamp: { ".sv": "timestamp" },
            replyCount: 0,
            parentPostId: postId,
            interactionScore: 2,
          },
          // [`users/${uidA}/replies/${postId}/${anonPostId}`]: true,
        }),
      );
    });

    it("allows creating a anonymous self-reply with required fields", async () => {
      const dbA = authedDb(uidA);
      const anonPostId = "anon_self_reply";

      await assertSucceeds(
        dbUpdate(dbA, "/", {
          [`replies/${postId}/${anonPostId}`]: {
            id: anonPostId,
            // userId is omitted here for anonymity
            postContent: "this is anonymous",
            timestamp: { ".sv": "timestamp" },
            replyCount: 0,
            parentPostId: postId,
            interactionScore: 2,
          },
          [`users/${uidA}/replies/${postId}/${anonPostId}`]: true,
        }),
      );
    });

    it("allows creating a anonymous reply with required fields", async () => {
      const dbB = authedDb(uidB);
      const anonPostId = "anon_post_123";

      await assertSucceeds(
        dbUpdate(dbB, "/", {
          [`replies/${postId}/${anonPostId}`]: {
            id: anonPostId,
            // userId is omitted here for anonymity
            postContent: "this is anonymous",
            timestamp: { ".sv": "timestamp" },
            replyCount: 0,
            parentPostId: postId,
            interactionScore: 2,
          },
          [`users/${uidB}/replies/${postId}/${anonPostId}`]: true,
        }),
      );
    });

    it("allows deleting an anonymous reply with required fields", async () => {
      const dbA = authedDb(uidA);
      const anonPostId = "anon_to_delete";

      // seed an anonymous reply with no userId field, but indexed for user_a
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = dbFromContext(context);
        await dbUpdate(db, "/", {
          [`replies/${postId}/${anonPostId}`]: {
            id: anonPostId,
            // userId is omitted here for anonymity
            postContent: "this is anonymous",
            timestamp: { ".sv": "timestamp" },
            replyCount: 0,
            parentPostId: postId,
            interactionScore: 2,
          },
          [`users/${uidA}/replies/${postId}/${anonPostId}`]: true,
        });
      });

      await assertSucceeds(
        dbUpdate(dbA, "/", {
          [`replies/${postId}/${anonPostId}`]: null,
          [`users/${uidA}/replies/${postId}/${anonPostId}`]: null,
        }),
      );
    });
  });

  describe("Non-Anonymous Reply Creation + Deletion", () => {
    it("denies creating a non-anonymous reply without interaction score", async () => {
      const dbB = authedDb(uidB);

      await assertFails(
        dbUpdate(dbB, "/", {
          [`replies/${postId}/${replyId}`]: {
            id: replyId,
            userId: uidB,
            postContent: "no score here",
            timestamp: Date.now(),
            replyCount: 0,
            parentPostId: postId,
            // interactionScore is missing!
          },
          [`users/${uidB}/replies/${postId}/${replyId}`]: true,
        }),
      );
    });

    it("denies creating a non-anonymous reply without linking to users/", async () => {
      const dbB = authedDb(uidB);
      await assertFails(
        // Trying to write only to the public tree without the private index
        dbSet(dbB, `replies/${postId}/${replyId}`, {
          id: replyId,
          userId: uidB,
          postContent: "trying to skip the index",
          timestamp: Date.now(),
          replyCount: 0,
          parentPostId: postId,
          interactionScore: 1,
        }),
      );
    });

    it("allows creating non-anonymous self-reply with required fields", async () => {
      const dbA = authedDb(uidA);
      const ownerReply = "reply_owner";
      await assertSucceeds(
        dbUpdate(dbA, "/", {
          [`replies/${postId}/${ownerReply}`]: {
            id: ownerReply,
            userId: uidA,
            postContent: "owner reply",
            timestamp: { ".sv": "timestamp" },
            replyCount: 0,
            parentPostId: postId,
            interactionScore: 2,
          },
          [`users/${uidA}/replies/${postId}/${ownerReply}`]: true,
        }),
      );
    });

    it("allows creating non-anonymous reply with required fields", async () => {
      const dbB = authedDb(uidB);

      await assertSucceeds(
        dbUpdate(dbB, "/", {
          [`replies/${postId}/${replyId}`]: {
            id: replyId,
            userId: uidB,
            postContent: "reply body",
            timestamp: { ".sv": "timestamp" },
            replyCount: 0,
            parentPostId: postId,
            interactionScore: 2,
          },
          [`users/${uidB}/replies/${postId}/${replyId}`]: true,
        }),
      );
    });

    it("allows deleting non-anonymous reply with required fields", async () => {
      const dbB = authedDb(uidB);

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = dbFromContext(context);
        await dbUpdate(db, "/", {
          [`replies/${postId}/${replyId}`]: {
            id: replyId,
            userId: uidB,
            postContent: "reply body",
            timestamp: { ".sv": "timestamp" },
            replyCount: 0,
            parentPostId: postId,
            interactionScore: 2,
          },
          [`users/${uidB}/replies/${postId}/${replyId}`]: true,
        });
      });

      await assertSucceeds(
        dbUpdate(dbB, "/", {
          [`replies/${postId}/${replyId}`]: null,
          [`users/${uidB}/replies/${postId}/${replyId}`]: null,
        }),
      );
    });
  });

  describe("Update & Deletion Security", () => {
    it("allows owner to edit postContent and denies non-owner", async () => {
      const dbA = authedDb(uidA);
      const dbB = authedDb(uidB);
      const newContent = "this is edited content";

      // check that the owner (User A) can edit their own post
      await assertSucceeds(
        dbUpdate(dbA, `posts/${postId}`, {
          postContent: newContent,
        }),
      );

      // check that a non-owner (User B) cannot edit User A's post
      await assertFails(
        dbUpdate(dbB, `posts/${postId}`, {
          postContent: "malicious edit",
        }),
      );
    });

    it("allows owner delete and denies non-owner delete", async () => {
      const dbA = authedDb(uidA);
      const dbB = authedDb(uidB);

      await assertSucceeds(
        dbUpdate(dbA, "/", {
          [`posts/${postId}`]: null,
          [`users/${uidA}/posts/${postId}`]: null,
        }),
      );

      // Re-seed post
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = dbFromContext(context);
        await dbUpdate(db, "/", {
          [`posts/${postId}`]: {
            postContent: "seed post",
            timestamp: Date.now(),
            replyCount: 0,
            userId: uidA,
            userInteractions: {},
          },
          [`users/${uidA}/posts/${postId}`]: true,
        });
      });

      await assertFails(
        dbUpdate(dbB, "/", {
          [`posts/${postId}`]: null,
          [`users/${uidA}/posts/${postId}`]: null,
        }),
      );
    });

    it("denies User B from deleting User A's anonymous post", async () => {
      const dbB = authedDb(uidB);
      const anonPostId = "uidA_secret_post";

      // Setup: Post belongs to User A (via index), but is anonymous publicly
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = dbFromContext(context);
        await dbUpdate(db, "/", {
          [`posts/${anonPostId}`]: {
            postContent: "Anonymous but owned by A",
            timestamp: Date.now(),
            replyCount: 0,
          },
          [`users/${uidA}/posts/${anonPostId}`]: true,
        });
      });

      // User B tries to delete the post and their own fake index
      await assertFails(
        dbUpdate(dbB, "/", {
          [`posts/${anonPostId}`]: null,
          [`users/${uidB}/posts/${anonPostId}`]: null,
        }),
      );
    });

    it("denies deleting reply without receipt or main object cleanup", async () => {
      const dbB = authedDb(uidB);

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = dbFromContext(context);
        await dbUpdate(db, "/", {
          [`replies/${postId}/${replyId}`]: {
            id: replyId,
            userId: uidB,
            postContent: "reply body",
            timestamp: { ".sv": "timestamp" },
            replyCount: 0,
            parentPostId: postId,
            interactionScore: 2,
          },
          [`users/${uidB}/replies/${postId}/${replyId}`]: true,
        });
      });

      // note that remove does the same thing as : null underneath
      await assertFails(
        dbRemove(dbB, `users/${uidB}/replies/${postId}/${replyId}`),
      );
      await assertFails(
        dbUpdate(dbB, "/", {
          [`users/${uidB}/replies/${postId}/${replyId}`]: null,
        }),
      );

      // note that remove does the same thing as : null underneath
      await assertFails(dbRemove(dbB, `replies/${postId}/${replyId}`));
      await assertFails(
        dbUpdate(dbB, "/", {
          [`replies/${postId}/${replyId}`]: null,
        }),
      );
    });
  });
});
