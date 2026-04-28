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

const uidCurrent = "user_current"; // currently logged in user, used as target
const uidOther = "user_other"; // some other logged in userA
const postId = "post_1";
const replyId = "reply_1";

let testEnv: RulesTestEnvironment;

const dbFromContext = (context: RulesTestContext) =>
  context.database(`http://127.0.0.1:9000?ns=${DB_NAME}`);

const userDb = (uid: string) =>
  dbFromContext(testEnv.authenticatedContext(uid));

const guestDb = () => dbFromContext(testEnv.unauthenticatedContext());

const dbGet = (db: ReturnType<typeof userDb>, path: string) =>
  db.ref(path).once("value");
const dbSet = (db: ReturnType<typeof userDb>, path: string, value: unknown) =>
  db.ref(path).set(value);
const dbUpdate = (
  db: ReturnType<typeof userDb>,
  path: string,
  value: Record<string, unknown>,
) => db.ref(path).update(value);
const dbRemove = (db: ReturnType<typeof userDb>, path: string) =>
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
          // userId: uidCurrent, // this is never needed anymore
        },
        [`authorLookup/${postId}`]: uidCurrent, // this is now required! authorLookup is only accessible to admin, though
        [`users/${uidCurrent}/posts/${postId}`]: true,
      });
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  describe("Reads", () => {
    describe("Denied Reads", () => {
      const sensitivePaths = [
        "users",
        `users/${uidCurrent}`,
        `users/${uidCurrent}/posts`,
        `users/${uidCurrent}/replies`,
        `users/${uidCurrent}/notifications`,
        `users/${uidCurrent}/subreplies`,
        `users/${uidCurrent}/displayName`,
        `users/${uidCurrent}/email`,
        `users/${uidCurrent}/postInteractions`,
      ];

      describe("by Guest User", () => {
        it.each(sensitivePaths)("access to %s", async (path) => {
          await assertFails(dbGet(guestDb(), path));
        });
      });

      describe("by (other) Authenticated User", () => {
        it.each(sensitivePaths)("access to %s", async (path) => {
          await assertFails(dbGet(userDb(uidOther), path));
        });
      });

      it("denies access to the authorLookup tree by anyone", async () => {
        await assertFails(dbGet(guestDb(), "authorLookup"));
        await assertFails(dbGet(guestDb(), `authorLookup/${postId}`));
        await assertFails(dbGet(userDb(uidOther), `authorLookup/${postId}`));
        await assertFails(dbGet(userDb(uidCurrent), `authorLookup/${postId}`)); // even author doesn't have access
      });
    });

    describe("Allowed Reads", () => {
      const subReplyId = "sub_1";

      beforeAll(async () => {
        // seed the reply and sub-reply for testing read access
        await testEnv.withSecurityRulesDisabled(async (context) => {
          const db = dbFromContext(context);
          await dbUpdate(db, "/", {
            [`replies/${postId}/${replyId}`]: {
              id: replyId,
              postContent: "seed reply",
              timestamp: Date.now(),
              parentPostId: postId,
              replyCount: 0,
              interactionScore: 0,
            },
            [`subreplies/${postId}/${replyId}/${subReplyId}`]: {
              id: subReplyId,
              postContent: "seed sub-reply",
              timestamp: Date.now(),
              parentPostId: postId,
              parentReplyId: replyId,
              authorDisplay: "Anonymous User",
            },
          });
        });
      });

      // we use a getter function (getDb) to defer initialization until runtime
      const roles = [
        { name: "Guest", getDb: () => guestDb() },
        { name: "Other User", getDb: () => userDb(uidOther) },
        { name: "Current User (Owner)", getDb: () => userDb(uidCurrent) },
      ];

      const publicPaths = [
        `posts/${postId}`,
        `replies/${postId}/${replyId}`,
        `subreplies/${postId}/${replyId}/${subReplyId}`,
      ];

      // check all roles against all public paths
      roles.forEach(({ name, getDb }) => {
        it.each(publicPaths)(`allows ${name} to read %s`, async (path) => {
          // getDb() is called here, safely inside the execution phase
          const db = getDb();
          const snap = await assertSucceeds(dbGet(db, path));
          expect(snap.exists()).toBe(true);
          // system check: ensure userId is NOT leaked in the public read
          expect(snap.child("userId").exists()).toBe(false);
        });
      });

      it("allows Current User to read their own users/ tree (profile, receipts, and notifications)", async () => {
        const dbCurrent = userDb(uidCurrent);
        const snap = await assertSucceeds(
          dbGet(dbCurrent, `users/${uidCurrent}`),
        );
        expect(snap.exists()).toBe(true);
      });
    });
  });

  describe("Writes", () => {
    describe("To Protected Fields", () => {
      describe("Denied Writes", () => {
        // 1. Check that replyCount is protected from everyone except the system (Cloud Functions)
        // We test both Guests and Other Users. Even the Owner is denied (tested in the previous block).
        it.each([
          { role: "Guest", getDb: () => guestDb() },
          { role: "Other User", getDb: () => userDb(uidOther) },
        ])(
          "denies $role from writing to replyCount on posts and replies",
          async ({ getDb }) => {
            const db = getDb();

            // Attempting to overwrite the counter directly
            await assertFails(dbSet(db, `posts/${postId}/replyCount`, 99));
            await assertFails(
              dbSet(db, `replies/${postId}/${replyId}/replyCount`, 99),
            );

            // Attempting an update on just that field
            await assertFails(
              dbUpdate(db, `posts/${postId}`, { replyCount: 1 }),
            );
          },
        );

        // 2. Ensure Guest users (public) cannot write to any content paths
        it.each([
          { path: `posts/new_post`, label: "top-level posts" },
          { path: `replies/${postId}/new_reply`, label: "replies" },
          {
            path: `subreplies/${postId}/${replyId}/new_sub`,
            label: "sub-replies",
          },
        ])("denies Guest from writing to $label", async ({ path }) => {
          const db = guestDb();

          await assertFails(
            dbSet(db, path, {
              postContent: "I am a guest",
              timestamp: Date.now(),
            }),
          );
        });

        // 3. Ensure no user can write to the 'id' field specifically
        // (This protects the internal document integrity)
        it("denies Other User from overwriting an existing post's internal ID", async () => {
          const db = userDb(uidOther);

          await assertFails(
            dbUpdate(db, `posts/${postId}`, {
              id: "different_id",
            }),
          );
        });
      });

      describe("Allowed Writes", () => {
        it("allows current user to update isRead status of their notification", async () => {
          const notifId = "notif_test_123";
          const notifPath = `users/${uidCurrent}/notifications/${notifId}`;

          // seed a notification first
          await testEnv.withSecurityRulesDisabled(async (context) => {
            const db = dbFromContext(context);
            await dbSet(db, notifPath, {
              type: "reply",
              isRead: false,
              count: 1,
              updatedAt: Date.now(),
              createdAt: Date.now(),
            });
          });

          // owner should be able to mark it as read
          // this satisfies the .validate requirement for type, isRead, and updatedAt
          await assertSucceeds(
            dbUpdate(userDb(uidCurrent), notifPath, {
              isRead: true,
              updatedAt: Date.now(),
            }),
          );
        });
      });

      describe("To Protected Fields", () => {
        describe("Denied Writes", () => {
          // Parameterized check for replyCount - even the owner is denied
          // because this is managed by Cloud Functions.
          it.each([
            { role: "Guest", getDb: () => guestDb() },
            { role: "Other User", getDb: () => userDb(uidOther) },
            { role: "Owner", getDb: () => userDb(uidCurrent) },
          ])(
            "denies $role from modifying replyCount on posts or replies",
            async ({ getDb }) => {
              const db = getDb();
              await assertFails(dbSet(db, `posts/${postId}/replyCount`, 10));
              await assertFails(
                dbSet(db, `replies/${postId}/${replyId}/replyCount`, 5),
              );
            },
          );

          // Verifying ID immutability and path-key matching
          it("denies a user from changing internal 'id' fields to mismatch the path key", async () => {
            const subReplyPath = `subreplies/${postId}/${replyId}/sub_target`;

            // Seed the sub-reply
            await testEnv.withSecurityRulesDisabled(async (context) => {
              const db = dbFromContext(context);
              await dbUpdate(db, "/", {
                [subReplyPath]: {
                  id: "sub_target",
                  postContent: "original",
                  authorDisplay: "Anon",
                },
                [`authorLookup/sub_target`]: uidCurrent,
                [`users/${uidCurrent}/${subReplyPath}`]: true,
              });
            });

            // Attempt to change the internal ID while keeping the path the same
            await assertFails(
              dbUpdate(userDb(uidCurrent), subReplyPath, {
                id: "malicious_id_swap",
              }),
            );
          });
        });

        describe("Allowed Writes", () => {
          it("allows current user to update the isRead status of their own notification", async () => {
            const notifId = "notif_test_123";
            const notifPath = `users/${uidCurrent}/notifications/${notifId}`;

            // Seed a notification
            await testEnv.withSecurityRulesDisabled(async (context) => {
              const db = dbFromContext(context);
              await dbSet(db, notifPath, {
                type: "reply",
                isRead: false,
                count: 1,
                updatedAt: Date.now(),
                createdAt: Date.now(),
              });
            });

            // System Check: User should be able to toggle isRead without affecting other fields
            await assertSucceeds(
              dbUpdate(userDb(uidCurrent), notifPath, {
                isRead: true,
                updatedAt: Date.now(),
              }),
            );
          });
        });
      });
    });

    it("denies deleting only the sub-reply object (without receipt)", async () => {
      const dbA = authedDb(uidA);
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = dbFromContext(context);
        await dbUpdate(db, "/", {
          [`subreplies/${postId}/${replyId}/${subReplyId}`]: {
            id: subReplyId,
            postContent: "to delete",
            timestamp: Date.now(),
            parentPostId: postId,
            parentReplyId: replyId,
            authorDisplay: "Anonymous User",
          },
          [`users/${uidA}/subreplies/${postId}/${replyId}/${subReplyId}`]: true,
        });
      });

      await assertFails(
        dbUpdate(dbA, "/", {
          [`subreplies/${postId}/${replyId}/${subReplyId}`]: null,
        }),
      );
    });

    it("denies deleting only the receipt (without sub-reply object)", async () => {
      const dbA = authedDb(uidA);
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = dbFromContext(context);
        await dbUpdate(db, "/", {
          [`subreplies/${postId}/${replyId}/${subReplyId}`]: {
            id: subReplyId,
            postContent: "to delete",
            timestamp: Date.now(),
            parentPostId: postId,
            parentReplyId: replyId,
            authorDisplay: "Anonymous User",
          },
          [`users/${uidA}/subreplies/${postId}/${replyId}/${subReplyId}`]: true,
        });
      });

      await assertFails(
        dbUpdate(dbA, "/", {
          [`users/${uidA}/subreplies/${postId}/${replyId}/${subReplyId}`]: null,
        }),
      );
    });
  });

  describe("Non-Anonymous Sub-Reply Creation + Deletion", () => {
    const subReplyId = "subreply_named_1";

    it("allows creating a non-anonymous sub-reply with userId", async () => {
      const dbB = authedDb(uidB);
      await assertSucceeds(
        dbUpdate(dbB, "/", {
          [`subreplies/${postId}/${replyId}/${subReplyId}`]: {
            id: subReplyId,
            userId: uidB,
            postContent: "named sub-reply",
            timestamp: { ".sv": "timestamp" },
            parentPostId: postId,
            parentReplyId: replyId,
            authorDisplay: "User B",
          },
          [`users/${uidB}/subreplies/${postId}/${replyId}/${subReplyId}`]: true,
        }),
      );
    });

    it("denies creating a sub-reply with a mismatched userId", async () => {
      const dbA = authedDb(uidA);
      await assertFails(
        dbUpdate(dbA, "/", {
          [`subreplies/${postId}/${replyId}/${subReplyId}`]: {
            id: subReplyId,
            userId: uidB, // wrong — auth is user_a
            postContent: "spoofed identity",
            timestamp: { ".sv": "timestamp" },
            parentPostId: postId,
            parentReplyId: replyId,
            authorDisplay: "User B",
          },
          [`users/${uidA}/subreplies/${postId}/${replyId}/${subReplyId}`]: true,
        }),
      );
    });

    it("allows deleting a non-anonymous sub-reply (with receipt)", async () => {
      const dbB = authedDb(uidB);
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = dbFromContext(context);
        await dbUpdate(db, "/", {
          [`subreplies/${postId}/${replyId}/${subReplyId}`]: {
            id: subReplyId,
            userId: uidB,
            postContent: "named sub to delete",
            timestamp: Date.now(),
            parentPostId: postId,
            parentReplyId: replyId,
            authorDisplay: "User B",
          },
          [`users/${uidB}/subreplies/${postId}/${replyId}/${subReplyId}`]: true,
        });
      });

      await assertSucceeds(
        dbUpdate(dbB, "/", {
          [`subreplies/${postId}/${replyId}/${subReplyId}`]: null,
          [`users/${uidB}/subreplies/${postId}/${replyId}/${subReplyId}`]: null,
        }),
      );
    });

    it("denies a non-owner from deleting another user's sub-reply", async () => {
      const dbA = authedDb(uidA);
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = dbFromContext(context);
        await dbUpdate(db, "/", {
          [`subreplies/${postId}/${replyId}/${subReplyId}`]: {
            id: subReplyId,
            userId: uidB,
            postContent: "belongs to B",
            timestamp: Date.now(),
            parentPostId: postId,
            parentReplyId: replyId,
            authorDisplay: "User B",
          },
          [`users/${uidB}/subreplies/${postId}/${replyId}/${subReplyId}`]: true,
        });
      });

      // User A tries to delete user B's sub-reply using their own receipt slot
      await assertFails(
        dbUpdate(dbA, "/", {
          [`subreplies/${postId}/${replyId}/${subReplyId}`]: null,
          [`users/${uidA}/subreplies/${postId}/${replyId}/${subReplyId}`]: null,
        }),
      );
    });
  });

  describe("Sub-Reply Validation", () => {
    const subReplyId = "subreply_validate_1";

    it("denies sub-reply with missing required fields", async () => {
      const dbA = authedDb(uidA);
      await assertFails(
        dbUpdate(dbA, "/", {
          [`subreplies/${postId}/${replyId}/${subReplyId}`]: {
            id: subReplyId,
            postContent: "missing timestamp & parentReplyId",
            parentPostId: postId,
            authorDisplay: "Anonymous User",
            // missing: timestamp, parentReplyId
          },
          [`users/${uidA}/subreplies/${postId}/${replyId}/${subReplyId}`]: true,
        }),
      );
    });

    it("denies sub-reply with wrong parentReplyId", async () => {
      const dbA = authedDb(uidA);
      await assertFails(
        dbUpdate(dbA, "/", {
          [`subreplies/${postId}/${replyId}/${subReplyId}`]: {
            id: subReplyId,
            postContent: "wrong parentReplyId",
            timestamp: { ".sv": "timestamp" },
            parentPostId: postId,
            parentReplyId: "wrong_reply_id",
            authorDisplay: "Anonymous User",
          },
          [`users/${uidA}/subreplies/${postId}/${replyId}/${subReplyId}`]: true,
        }),
      );
    });

    it("denies sub-reply with wrong parentPostId", async () => {
      const dbA = authedDb(uidA);
      await assertFails(
        dbUpdate(dbA, "/", {
          [`subreplies/${postId}/${replyId}/${subReplyId}`]: {
            id: subReplyId,
            postContent: "wrong parentPostId",
            timestamp: { ".sv": "timestamp" },
            parentPostId: "wrong_post_id",
            parentReplyId: replyId,
            authorDisplay: "Anonymous User",
          },
          [`users/${uidA}/subreplies/${postId}/${replyId}/${subReplyId}`]: true,
        }),
      );
    });

    it("denies sub-reply with wrong id field", async () => {
      const dbA = authedDb(uidA);
      await assertFails(
        dbUpdate(dbA, "/", {
          [`subreplies/${postId}/${replyId}/${subReplyId}`]: {
            id: "some_other_id", // does not match $subreply_id
            postContent: "bad id",
            timestamp: { ".sv": "timestamp" },
            parentPostId: postId,
            parentReplyId: replyId,
            authorDisplay: "Anonymous User",
          },
          [`users/${uidA}/subreplies/${postId}/${replyId}/${subReplyId}`]: true,
        }),
      );
    });

    it("denies sub-reply with postContent exceeding 600 chars", async () => {
      const dbA = authedDb(uidA);
      await assertFails(
        dbUpdate(dbA, "/", {
          [`subreplies/${postId}/${replyId}/${subReplyId}`]: {
            id: subReplyId,
            postContent: "x".repeat(601),
            timestamp: { ".sv": "timestamp" },
            parentPostId: postId,
            parentReplyId: replyId,
            authorDisplay: "Anonymous User",
          },
          [`users/${uidA}/subreplies/${postId}/${replyId}/${subReplyId}`]: true,
        }),
      );
    });

    it("denies unauthenticated sub-reply creation", async () => {
      const db = unAuthedDb();
      await assertFails(
        dbUpdate(db, "/", {
          [`subreplies/${postId}/${replyId}/${subReplyId}`]: {
            id: subReplyId,
            postContent: "anon write attempt",
            timestamp: { ".sv": "timestamp" },
            parentPostId: postId,
            parentReplyId: replyId,
            authorDisplay: "Anonymous User",
          },
        }),
      );
    });
  });

  describe("Sub-Reply Lazy Cleanup (orphan receipt)", () => {
    it("allows lazy cleanup of a dangling subreply receipt when public object is gone", async () => {
      const orphanSubReplyId = "orphan_subreply_999";

      // seed only the receipt, no public object (mimics cloud-fn cascade delete)
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = dbFromContext(context);
        await dbUpdate(db, "/", {
          [`users/${uidA}/subreplies/${postId}/${replyId}/${orphanSubReplyId}`]: true,
          // note: subreplies/ object is intentionally absent
        });
      });

      // client self-heals the dangling receipt
      await assertSucceeds(
        dbRemove(
          authedDb(uidA),
          `users/${uidA}/subreplies/${postId}/${replyId}/${orphanSubReplyId}`,
        ),
      );
    });
  });
});
