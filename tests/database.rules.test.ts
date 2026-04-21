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

  it("allows users to read/write their own users tree and denies others", async () => {
    const dbA = authedDb(uidA);
    const dbB = authedDb(uidB);

    await assertSucceeds(
      dbSet(dbA, `users/${uidA}/notifications/test`, {
        type: "reply",
        isRead: false,
        updatedAt: Date.now(),
      }),
    );

    await assertFails(dbGet(dbB, `users/${uidA}`));
    await assertFails(dbSet(dbB, `users/${uidA}/posts/evil`, true));
  });

  it("allows public reads of posts/replies and denies unauthenticated writes", async () => {
    const db = anonDb();

    await assertSucceeds(dbGet(db, `posts/${postId}`));
    await assertFails(
      dbSet(db, "posts/post_x", {
        postContent: "anon write",
        timestamp: Date.now(),
        replyCount: 0,
      }),
    );
  });

  // NOTE: tests legacy data
  it("allows creating a top-level post when userId + required fields are included", async () => {
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
        [`users/${uidA}/posts/${newPost}`]: true,
      }),
    );
  });

  // NOTE: tests legacy data
  it("denies creating a top-level post when users index path is missing", async () => {
    const dbA = authedDb(uidA);
    const newPost = "post_no_index";

    await assertFails(
      dbSet(dbA, `posts/${newPost}`, {
        id: newPost,
        postContent: "missing index",
        timestamp: Date.now(),
        replyCount: 0,
      }),
    );
  });

  // NOTE: tests legacy data
  it("denies top-level post create when userId does not match auth.uid", async () => {
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

  // NOTE: tests legacy data
  it("denies top-level post create when required fields are missing", async () => {
    const dbA = authedDb(uidA);
    const newPost = "post_missing_fields";

    await assertFails(
      dbUpdate(dbA, "/", {
        [`posts/${newPost}`]: {
          id: newPost,
          userId: uidA,
          postContent: "missing replyCount/timestamp",
        },
        [`users/${uidA}/posts/${newPost}`]: true,
      }),
    );
  });

  // NOTE: tests legacy data
  it("denies top-level post create when postContent exceeds 600 chars", async () => {
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

  // NOTE: tests legacy data
  it("denies non-owner reply create even with interactionScore + users reply index", async () => {
    const dbB = authedDb(uidB);

    await assertFails(
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

  // NOTE: tests legacy data
  it("allows owner reply create with interactionScore + users reply index", async () => {
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

  // NOTE: tests legacy data
  it("allows owner reply create when users reply index path is missing (granted by parent thread write rule)", async () => {
    const dbA = authedDb(uidA);
    const replyNoIndex = "reply_no_index";

    await assertSucceeds(
      dbSet(dbA, `replies/${postId}/${replyNoIndex}`, {
        id: replyNoIndex,
        userId: uidA,
        postContent: "owner reply without index path",
        timestamp: { ".sv": "timestamp" },
        replyCount: 0,
        parentPostId: postId,
        interactionScore: 1,
      }),
    );
  });

  // NOTE: tests legacy data
  it("denies owner reply create when parentPostId does not match thread id", async () => {
    const dbA = authedDb(uidA);
    const badParentReply = "reply_bad_parent";

    await assertFails(
      dbUpdate(dbA, "/", {
        [`replies/${postId}/${badParentReply}`]: {
          id: badParentReply,
          userId: uidA,
          postContent: "bad parent",
          timestamp: { ".sv": "timestamp" },
          replyCount: 0,
          parentPostId: "another_post",
          interactionScore: 2,
        },
        [`users/${uidA}/replies/${postId}/${badParentReply}`]: true,
      }),
    );
  });

  // NOTE: tests legacy data
  it("denies owner reply create when interactionScore is out of range", async () => {
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
        [`users/${uidA}/replies/${postId}/${outOfRangeReply}`]: true,
      }),
    );
  });

  // NOTE: tests legacy data
  it("denies reply create without interactionScore in legacy shape", async () => {
    const dbB = authedDb(uidB);
    const badReply = "reply_bad";

    await assertFails(
      dbUpdate(dbB, "/", {
        [`replies/${postId}/${badReply}`]: {
          id: badReply,
          userId: uidB,
          postContent: "should fail",
          timestamp: { ".sv": "timestamp" },
          replyCount: 0,
          parentPostId: postId,
        },
        [`users/${uidB}/replies/${postId}/${badReply}`]: true,
      }),
    );
  });

  // NOTE: tests legacy data
  it("denies owner reply create when reply userId does not match auth.uid", async () => {
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

  // NOTE: tests legacy data
  it("denies owner reply create when postContent exceeds 600 chars", async () => {
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

  it("allows owner delete by users index and denies non-owner delete", async () => {
    const dbA = authedDb(uidA);
    const dbB = authedDb(uidB);

    await assertSucceeds(dbRemove(dbA, `posts/${postId}`));

    // recreate seed post for non-owner delete check
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

    await assertFails(dbRemove(dbB, `posts/${postId}`));
  });

  // NOTE: tests legacy data
  it("allows owner direct field writes but denies non-owner direct field writes", async () => {
    const dbA = authedDb(uidA);
    const dbB = authedDb(uidB);

    // With current rules, owner write access on /posts/$post_id is broad enough to permit these.
    await assertSucceeds(dbSet(dbA, `posts/${postId}/replyCount`, 999));
    await assertSucceeds(
      dbSet(dbA, `posts/${postId}/userInteractions/${uidA}`, 3),
    );

    await assertFails(dbSet(dbB, `posts/${postId}/replyCount`, 123));
    await assertFails(
      dbSet(dbB, `posts/${postId}/userInteractions/${uidB}`, 1),
    );
  });

  // NOTE: tests legacy data
  it("legacy post shape still reads correctly (no authorDisplay/isThreadAuthor)", async () => {
    const db = anonDb();
    const snap = await assertSucceeds(dbGet(db, `posts/${postId}`));
    expect(snap.exists()).toBe(true);
    expect(snap.child("postContent").val()).toBe("seed post");
    expect(snap.child("userId").val()).toBe(uidA);
  });
});
