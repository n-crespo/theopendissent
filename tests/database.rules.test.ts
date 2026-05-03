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

// TODO: update rules to enforce thread author privacy lock

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
        },
        // authorLookup must be an object now to map the relational tree
        [`authorLookup/${postId}`]: { uid: uidCurrent, type: "post" },
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
    describe("Denied", () => {
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

      describe("by Guest", () => {
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

    describe("Allowed", () => {
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

  describe("Writes (create/delete)", () => {
    describe("To Protected Fields", () => {
      describe("Denied Writes", () => {
        it.each([
          { role: "Guest", getDb: () => guestDb() },
          { role: "Other User", getDb: () => userDb(uidOther) },
          { role: "Owner", getDb: () => userDb(uidCurrent) },
        ])(
          "denies $role from modifying replyCount on posts or replies",
          async ({ getDb }) => {
            const db = getDb();

            // attempt overwrite
            await assertFails(dbSet(db, `posts/${postId}/replyCount`, 99));
            await assertFails(
              dbSet(db, `replies/${postId}/${replyId}/replyCount`, 99),
            );

            // attempt partial update
            await assertFails(
              dbUpdate(db, `posts/${postId}`, { replyCount: 1 }),
            );
          },
        );

        // ensure guest users cannot write to any content paths
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

        // verify id immutability and path-key matching
        it("denies users from changing internal 'id' fields", async () => {
          const subReplyPath = `subreplies/${postId}/${replyId}/sub_target`;

          // seed the sub-reply with the new object payload
          await testEnv.withSecurityRulesDisabled(async (context) => {
            const db = dbFromContext(context);
            await dbUpdate(db, "/", {
              [subReplyPath]: {
                id: "sub_target",
                postContent: "original",
                authorDisplay: "Anon",
              },
              [`authorLookup/sub_target`]: {
                uid: uidCurrent,
                type: "subreply",
                postId: postId,
                replyId: replyId,
              },
              [`users/${uidCurrent}/${subReplyPath}`]: true,
            });
          });

          // attempt to change the internal id
          await assertFails(
            dbUpdate(userDb(uidCurrent), subReplyPath, {
              id: "malicious_id_swap",
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
          await assertSucceeds(
            dbUpdate(userDb(uidCurrent), notifPath, {
              isRead: true,
              updatedAt: Date.now(),
            }),
          );
        });
      });
    });

    describe("To Object", () => {
      const newId = "new_id_123";

      // shared scenarios include the new lookupData required for authorLookup
      const scenarios = [
        {
          label: "Post",
          path: `posts/${newId}`,
          profile: `users/${uidCurrent}/posts/${newId}`,
          lookup: `authorLookup/${newId}`,
          lookupData: { uid: uidCurrent, type: "post" },
          validData: {
            id: newId,
            postContent: "test content",
            timestamp: { ".sv": "timestamp" },
            replyCount: 0,
          },
        },
        {
          label: "Reply",
          path: `replies/${postId}/${newId}`,
          profile: `users/${uidCurrent}/replies/${postId}/${newId}`,
          lookup: `authorLookup/${newId}`,
          lookupData: { uid: uidCurrent, type: "reply", postId },
          validData: {
            id: newId,
            postContent: "test reply",
            timestamp: { ".sv": "timestamp" },
            parentPostId: postId,
            interactionScore: 0,
            replyCount: 0,
          },
        },
        {
          label: "Sub-Reply",
          path: `subreplies/${postId}/${replyId}/${newId}`,
          profile: `users/${uidCurrent}/subreplies/${postId}/${replyId}/${newId}`,
          lookup: `authorLookup/${newId}`,
          lookupData: { uid: uidCurrent, type: "subreply", postId, replyId },
          validData: {
            id: newId,
            postContent: "test sub",
            timestamp: { ".sv": "timestamp" },
            parentPostId: postId,
            parentReplyId: replyId,
            authorDisplay: "Anon",
          },
        },
      ];

      describe("Shared Atomic Denials", () => {
        it.each(scenarios)(
          "denies partial $label creation writes",
          async ({ path, profile, lookup, lookupData, validData }) => {
            const db = userDb(uidCurrent);

            // only main object
            await assertFails(dbSet(db, path, validData));
            // only profile receipt
            await assertFails(dbSet(db, profile, true));
            // only ownership receipt
            await assertFails(dbSet(db, lookup, lookupData));
            // only profile + ownership receipt
            await assertFails(
              dbUpdate(db, "/", { [profile]: true, [lookup]: lookupData }),
            );
            // only main + profile receipt
            await assertFails(
              dbUpdate(db, "/", { [path]: validData, [profile]: true }),
            );
            // only main + ownership receipt
            await assertFails(
              dbUpdate(db, "/", { [path]: validData, [lookup]: lookupData }),
            );
          },
        );

        it.each(scenarios)(
          "denies unauthenticated creation of $label",
          async ({ path, profile, lookup, lookupData, validData }) => {
            await assertFails(
              dbUpdate(guestDb(), "/", {
                [path]: validData,
                [profile]: true,
                [lookup]: lookupData,
              }),
            );
          },
        );

        it.each(scenarios)(
          "denies UID mismatch (User B on User A paths)",
          async ({ path, profile, lookup, lookupData, validData }) => {
            // user B tries to claim they are the owner in the lookup or profile while authed as B
            await assertFails(
              dbUpdate(userDb(uidOther), "/", {
                [path]: validData,
                [profile]: true,
                [lookup]: lookupData,
              }),
            );
          },
        );
      });

      describe("All Creation Validation", () => {
        it.each(scenarios)(
          "denies $label creation with invalid fields",
          async ({ path, profile, lookup, lookupData, validData }) => {
            const db = userDb(uidCurrent);

            // wrongly includes userId (shadow tree prohibits this)
            await assertFails(
              dbUpdate(db, "/", {
                [path]: { ...validData, userId: uidCurrent },
                [profile]: true,
                [lookup]: lookupData,
              }),
            );

            // timestamp missing
            const { timestamp, ...noTime } = validData as any;
            await assertFails(
              dbUpdate(db, "/", {
                [path]: noTime,
                [profile]: true,
                [lookup]: lookupData,
              }),
            );

            // over 600 chars
            await assertFails(
              dbUpdate(db, "/", {
                [path]: { ...validData, postContent: "A".repeat(601) },
                [profile]: true,
                [lookup]: lookupData,
              }),
            );
          },
        );
      });

      describe("Post Creation", () => {
        it("allows: all required fields + both receipts (with cleanup)", async () => {
          const s = scenarios[0];
          const db = userDb(uidCurrent);

          // perform the atomic creation
          await assertSucceeds(
            db.ref("/").update({
              [s.path]: s.validData,
              [s.profile]: true,
              [s.lookup]: s.lookupData,
            }),
          );

          // immediately perform an atomic deletion to clean up the state
          await assertSucceeds(
            db.ref("/").update({
              [s.path]: null,
              [s.profile]: null,
              [s.lookup]: null,
            }),
          );
        });
      });

      describe("Reply Creation", () => {
        const s = scenarios[1];
        it.each([
          {
            desc: "out of range interactionScore",
            data: { ...s.validData, interactionScore: 5 },
          },
          {
            desc: "wrong parentPostId",
            data: { ...s.validData, parentPostId: "wrong_id" },
          },
          {
            desc: "missing parentPostId",
            data: {
              id: newId,
              postContent: "...",
              timestamp: { ".sv": "timestamp" },
              interactionScore: 0,
              replyCount: 0,
            },
          },
          {
            desc: "missing interactionScore",
            data: {
              id: newId,
              postContent: "...",
              timestamp: { ".sv": "timestamp" },
              parentPostId: postId,
              replyCount: 0,
            },
          },
        ])("denies reply creation: $desc", async ({ data }) => {
          await assertFails(
            dbUpdate(userDb(uidCurrent), "/", {
              [s.path]: data,
              [s.profile]: true,
              [s.lookup]: s.lookupData,
            }),
          );
        });

        it("allows: all required fields + receipts (with cleanup)", async () => {
          const db = userDb(uidCurrent);
          const payload = {
            [s.path]: s.validData,
            [s.profile]: true,
            [s.lookup]: s.lookupData,
          };

          // print the payload to the console
          console.log(
            `Payload for ${s.label}:`,
            JSON.stringify(payload, null, 2),
          );

          // verify atomic creation
          await assertSucceeds(dbUpdate(db, "/", payload));

          // verify atomic deletion cleanup
          await assertSucceeds(
            dbUpdate(db, "/", {
              [s.path]: null,
              [s.profile]: null,
              [s.lookup]: null,
            }),
          );
        });
      });

      describe("Sub-Reply Creation", () => {
        const s = scenarios[2];
        it.each([
          {
            desc: "wrong parentReplyId",
            data: { ...s.validData, parentReplyId: "wrong_reply" },
          },
          {
            desc: "wrong parentPostId (root)",
            data: { ...s.validData, parentPostId: "wrong_post" },
          },
          {
            desc: "missing parentReplyId",
            data: {
              id: newId,
              postContent: "...",
              timestamp: { ".sv": "timestamp" },
              parentPostId: postId,
              authorDisplay: "Anon",
            },
          },
          {
            desc: "missing parentPostId",
            data: {
              id: newId,
              postContent: "...",
              timestamp: { ".sv": "timestamp" },
              parentReplyId: replyId,
              authorDisplay: "Anon",
            },
          },
        ])("denies sub-reply creation: $desc", async ({ data }) => {
          await assertFails(
            dbUpdate(userDb(uidCurrent), "/", {
              [s.path]: data,
              [s.profile]: true,
              [s.lookup]: s.lookupData,
            }),
          );
        });

        it("allows: all required fields + receipts (with cleanup)", async () => {
          const db = userDb(uidCurrent);
          const payload = {
            [s.path]: s.validData,
            [s.profile]: true,
            [s.lookup]: s.lookupData,
          };

          // print the payload to the console
          console.log(
            `Payload for ${s.label}:`,
            JSON.stringify(payload, null, 2),
          );

          // verify atomic creation
          await assertSucceeds(dbUpdate(db, "/", payload));

          // verify atomic deletion cleanup
          await assertSucceeds(
            dbUpdate(db, "/", {
              [s.path]: null,
              [s.profile]: null,
              [s.lookup]: null,
            }),
          );
        });
      });

      describe("All Deletion", () => {
        it.each(scenarios)(
          "allows $label deletion: main object + both receipts sent",
          async ({ path, profile, lookup, lookupData, validData }) => {
            const db = userDb(uidCurrent);
            // seed first
            await testEnv.withSecurityRulesDisabled((c) =>
              dbUpdate(dbFromContext(c), "/", {
                [path]: validData,
                [profile]: true,
                [lookup]: lookupData,
              }),
            );

            // atomic delete
            await assertSucceeds(
              dbUpdate(db, "/", {
                [path]: null,
                [profile]: null,
                [lookup]: null,
              }),
            );
          },
        );

        it.each(scenarios)(
          "denies deletion of $label by wrong user or guest",
          async ({ path, profile, lookup, lookupData, validData }) => {
            await testEnv.withSecurityRulesDisabled((c) =>
              dbUpdate(dbFromContext(c), "/", {
                [path]: validData,
                [profile]: true,
                [lookup]: lookupData,
              }),
            );

            await assertFails(
              dbUpdate(userDb(uidOther), "/", {
                [path]: null,
                [profile]: null,
                [lookup]: null,
              }),
            );
            await assertFails(
              dbUpdate(guestDb(), "/", {
                [path]: null,
                [profile]: null,
                [lookup]: null,
              }),
            );
          },
        );
      });
    });
  });

  describe("Edits", () => {
    const scenarios = [
      {
        label: "Post",
        path: `posts/${postId}`,
        lookup: `authorLookup/${postId}`,
        profile: `users/${uidCurrent}/posts/${postId}`,
      },
      {
        label: "Reply",
        path: `replies/${postId}/${replyId}`,
        lookup: `authorLookup/${replyId}`,
        profile: `users/${uidCurrent}/replies/${postId}/${replyId}`,
      },
      {
        label: "Sub-Reply",
        path: `subreplies/${postId}/${replyId}/sub_1`,
        lookup: `authorLookup/sub_1`,
        profile: `users/${uidCurrent}/subreplies/${postId}/${replyId}/sub_1`,
      },
    ];

    beforeEach(async () => {
      // seed the database with the objects to be edited
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = dbFromContext(context);
        const now = Date.now();
        await dbUpdate(db, "/", {
          [scenarios[0].path]: {
            id: postId,
            postContent: "orig",
            timestamp: now,
            replyCount: 0,
          },
          [scenarios[0].lookup]: { uid: uidCurrent, type: "post" },
          [scenarios[0].profile]: true,

          [scenarios[1].path]: {
            id: replyId,
            postContent: "orig",
            timestamp: now,
            parentPostId: postId,
            interactionScore: 0,
            replyCount: 0,
          },
          [scenarios[1].lookup]: { uid: uidCurrent, type: "reply", postId },
          [scenarios[1].profile]: true,

          [scenarios[2].path]: {
            id: "sub_1",
            postContent: "orig",
            timestamp: now,
            parentPostId: postId,
            parentReplyId: replyId,
            authorDisplay: "Anon",
          },
          [scenarios[2].lookup]: {
            uid: uidCurrent,
            type: "subreply",
            postId: postId,
            replyId: replyId,
          },
          [scenarios[2].profile]: true,
        });
      });
    });

    describe("Allowed", () => {
      it.each(scenarios)(
        "allows owner to edit postContent and editedAt for $label",
        async ({ path }) => {
          const db = userDb(uidCurrent);
          await assertSucceeds(
            dbUpdate(db, path, {
              postContent: "updated content",
              editedAt: Date.now(),
            }),
          );
        },
      );
    });

    describe("Denied", () => {
      it.each(scenarios)(
        "denies owner from editing protected fields in $label",
        async ({ path }) => {
          const db = userDb(uidCurrent);

          // owner edits id
          await assertFails(dbUpdate(db, path, { id: "new_id" }));
          // owner edits timestamp
          await assertFails(
            dbUpdate(db, path, { timestamp: Date.now() + 1000 }),
          );
          // owner edits replyCount (if applicable)
          if (!path.includes("subreplies")) {
            await assertFails(dbUpdate(db, path, { replyCount: 99 }));
          }
        },
      );

      it.each(scenarios)(
        "denies guest or non-owner from any edit to $label",
        async ({ path }) => {
          const dbOther = userDb(uidOther);
          const dbGuest = guestDb();
          const edit = { postContent: "hacked" };

          await assertFails(dbUpdate(dbOther, path, edit));
          await assertFails(dbUpdate(dbGuest, path, edit));
        },
      );
    });
  });
});
