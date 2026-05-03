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
import {
  buildCreateUpdates,
  buildDeleteUpdates,
  buildEditUpdates,
  buildShareUrl,
} from "../src/lib/updateBuilders.ts";

const PROJECT_ID = "the-open-dissent-prod";
const DB_NAME = "the-open-dissent-prod-default-rtdb";

const uid = "user_a";
const uidOther = "user_b";

let testEnv: RulesTestEnvironment;

const dbFromContext = (context: RulesTestContext) =>
  context.database(`http://127.0.0.1:9000?ns=${DB_NAME}`);

const userDb = (userId: string) =>
  dbFromContext(testEnv.authenticatedContext(userId));

const guestDb = () => dbFromContext(testEnv.unauthenticatedContext());

const dbUpdate = (
  db: ReturnType<typeof userDb>,
  path: string,
  value: Record<string, unknown>,
) => db.ref(path).update(value);

const dbGet = (db: ReturnType<typeof userDb>, path: string) =>
  db.ref(path).once("value");

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

describe("Integration tests (updateBuilders + rules)", () => {
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

  // =========================================================================
  // CREATE TESTS
  // =========================================================================

  describe("Create", () => {
    // Fresh DB for every create test
    beforeEach(async () => {
      await testEnv.clearDatabase();
    });

    // -- Posts ---------------------------------------------------------------

    it("creates an anonymous post", async () => {
      const updates = buildCreateUpdates({
        key: "post_anon",
        userId: uid,
        content: "Hello world",
        authorDisplay: "Anonymous User",
      });

      await assertSucceeds(dbUpdate(userDb(uid), "/", updates));

      // verify content exists
      const snap = await dbGet(guestDb(), "posts/post_anon");
      expect(snap.exists()).toBe(true);
      expect(snap.val().authorDisplay).toBe("Anonymous User");
      expect(snap.val().postContent).toBe("Hello world");
      expect(snap.child("userId").exists()).toBe(false);
    });

    it("creates a non-anonymous post", async () => {
      const updates = buildCreateUpdates({
        key: "post_named",
        userId: uid,
        content: "I have a name",
        authorDisplay: "John Doe",
      });

      await assertSucceeds(dbUpdate(userDb(uid), "/", updates));

      const snap = await dbGet(guestDb(), "posts/post_named");
      expect(snap.exists()).toBe(true);
      expect(snap.val().authorDisplay).toBe("John Doe");
      expect(snap.child("userId").exists()).toBe(false);
    });

    // -- Replies ------------------------------------------------------------

    describe("Replies", () => {
      const parentPostId = "parent_post";

      beforeEach(async () => {
        // seed a parent post
        await testEnv.withSecurityRulesDisabled(async (context) => {
          const db = dbFromContext(context);
          await dbUpdate(db, "/", {
            [`posts/${parentPostId}`]: {
              postContent: "parent",
              timestamp: Date.now(),
              replyCount: 0,
            },
            [`authorLookup/${parentPostId}`]: { uid, type: "post" },
            [`users/${uid}/posts/${parentPostId}`]: true,
          });
        });
      });

      it("creates an anonymous reply", async () => {
        const updates = buildCreateUpdates({
          key: "reply_anon",
          userId: uid,
          content: "Anonymous reply",
          authorDisplay: "Anonymous User",
          parentPostId,
          score: 0,
        });

        await assertSucceeds(dbUpdate(userDb(uid), "/", updates));

        const snap = await dbGet(
          guestDb(),
          `replies/${parentPostId}/reply_anon`,
        );
        expect(snap.exists()).toBe(true);
        expect(snap.val().authorDisplay).toBe("Anonymous User");
        expect(snap.val().parentPostId).toBe(parentPostId);
      });

      it("creates a non-anonymous reply", async () => {
        const updates = buildCreateUpdates({
          key: "reply_named",
          userId: uid,
          content: "Named reply",
          authorDisplay: "Jane Smith",
          parentPostId,
          score: 2,
        });

        await assertSucceeds(dbUpdate(userDb(uid), "/", updates));

        const snap = await dbGet(
          guestDb(),
          `replies/${parentPostId}/reply_named`,
        );
        expect(snap.exists()).toBe(true);
        expect(snap.val().authorDisplay).toBe("Jane Smith");
        expect(snap.val().interactionScore).toBe(2);
      });

      it("creates a thread-author reply (matching anonymity)", async () => {
        const updates = buildCreateUpdates({
          key: "reply_author",
          userId: uid,
          content: "Author chiming in",
          authorDisplay: "Anonymous User",
          parentPostId,
          score: 0,
          isThreadAuthor: true,
        });

        await assertSucceeds(dbUpdate(userDb(uid), "/", updates));

        const snap = await dbGet(
          guestDb(),
          `replies/${parentPostId}/reply_author`,
        );
        expect(snap.val().isThreadAuthor).toBe(true);
      });
    });

    // -- Sub-Replies --------------------------------------------------------

    describe("Sub-Replies", () => {
      const parentPostId = "root_post";
      const parentReplyId = "parent_reply";

      beforeEach(async () => {
        // seed root post + parent reply
        await testEnv.withSecurityRulesDisabled(async (context) => {
          const db = dbFromContext(context);
          await dbUpdate(db, "/", {
            [`posts/${parentPostId}`]: {
              postContent: "root",
              timestamp: Date.now(),
              replyCount: 1,
            },
            [`authorLookup/${parentPostId}`]: { uid, type: "post" },
            [`users/${uid}/posts/${parentPostId}`]: true,
            [`replies/${parentPostId}/${parentReplyId}`]: {
              id: parentReplyId,
              postContent: "reply",
              timestamp: Date.now(),
              parentPostId,
              replyCount: 0,
              interactionScore: 0,
            },
            [`authorLookup/${parentReplyId}`]: {
              uid,
              type: "reply",
              postId: parentPostId,
            },
            [`users/${uid}/replies/${parentPostId}/${parentReplyId}`]: true,
          });
        });
      });

      it("creates an anonymous sub-reply", async () => {
        const updates = buildCreateUpdates({
          key: "sub_anon",
          userId: uidOther,
          content: "Anon sub-reply",
          authorDisplay: "Anonymous User",
          parentPostId,
          parentReplyId,
        });

        await assertSucceeds(dbUpdate(userDb(uidOther), "/", updates));

        const snap = await dbGet(
          guestDb(),
          `subreplies/${parentPostId}/${parentReplyId}/sub_anon`,
        );
        expect(snap.exists()).toBe(true);
        expect(snap.val().authorDisplay).toBe("Anonymous User");
      });

      it("creates a non-anonymous sub-reply", async () => {
        const updates = buildCreateUpdates({
          key: "sub_named",
          userId: uidOther,
          content: "Named sub-reply",
          authorDisplay: "Bob Builder",
          parentPostId,
          parentReplyId,
        });

        await assertSucceeds(dbUpdate(userDb(uidOther), "/", updates));

        const snap = await dbGet(
          guestDb(),
          `subreplies/${parentPostId}/${parentReplyId}/sub_named`,
        );
        expect(snap.val().authorDisplay).toBe("Bob Builder");
      });
    });
  });

  // =========================================================================
  // DELETE TESTS
  // =========================================================================

  describe("Delete", () => {
    beforeEach(async () => {
      await testEnv.clearDatabase();
    });

    // Helper: seed content using builders (via admin bypass)
    const seedContent = async (updates: Record<string, any>) => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await dbFromContext(context).ref("/").update(updates);
      });
    };

    // -- Posts --------------------------------------------------------------

    it("deletes an anonymous post (no children)", async () => {
      const createUpdates = buildCreateUpdates({
        key: "del_post",
        userId: uid,
        content: "will be deleted",
        authorDisplay: "Anonymous User",
      });
      await seedContent(createUpdates);

      const deleteUpdates = buildDeleteUpdates(
        { id: "del_post", parentPostId: undefined, parentReplyId: undefined },
        uid,
      );
      await assertSucceeds(dbUpdate(userDb(uid), "/", deleteUpdates));

      // verify everything is gone
      const postSnap = await dbGet(guestDb(), "posts/del_post");
      expect(postSnap.exists()).toBe(false);
    });

    it("deletes a non-anonymous post (no children)", async () => {
      const createUpdates = buildCreateUpdates({
        key: "del_post_named",
        userId: uid,
        content: "named post",
        authorDisplay: "Jane Doe",
      });
      await seedContent(createUpdates);

      const deleteUpdates = buildDeleteUpdates(
        {
          id: "del_post_named",
          parentPostId: undefined,
          parentReplyId: undefined,
        },
        uid,
      );
      await assertSucceeds(dbUpdate(userDb(uid), "/", deleteUpdates));

      const postSnap = await dbGet(guestDb(), "posts/del_post_named");
      expect(postSnap.exists()).toBe(false);
    });

    it("deletes a post that has replies (replies survive for cloud function cascade)", async () => {
      // seed post + a reply
      const postUpdates = buildCreateUpdates({
        key: "post_with_replies",
        userId: uid,
        content: "has replies",
        authorDisplay: "Anonymous User",
      });
      const replyUpdates = buildCreateUpdates({
        key: "child_reply",
        userId: uidOther,
        content: "I am a reply",
        authorDisplay: "Anonymous User",
        parentPostId: "post_with_replies",
        score: 0,
      });
      await seedContent({ ...postUpdates, ...replyUpdates });

      // client-side delete of the post only
      const deleteUpdates = buildDeleteUpdates(
        {
          id: "post_with_replies",
          parentPostId: undefined,
          parentReplyId: undefined,
        },
        uid,
      );
      await assertSucceeds(dbUpdate(userDb(uid), "/", deleteUpdates));

      // post is gone
      const postSnap = await dbGet(guestDb(), "posts/post_with_replies");
      expect(postSnap.exists()).toBe(false);

      // reply still exists (cloud function would clean it up)
      const replySnap = await dbGet(
        guestDb(),
        "replies/post_with_replies/child_reply",
      );
      expect(replySnap.exists()).toBe(true);
    });

    it("deletes a post with replies that have subreplies (all children survive)", async () => {
      const postId = "post_deep";
      const replyId = "reply_deep";
      const subId = "sub_deep";

      await seedContent({
        ...buildCreateUpdates({
          key: postId,
          userId: uid,
          content: "deep post",
          authorDisplay: "Anonymous User",
        }),
        ...buildCreateUpdates({
          key: replyId,
          userId: uidOther,
          content: "deep reply",
          authorDisplay: "Anonymous User",
          parentPostId: postId,
          score: 0,
        }),
        ...buildCreateUpdates({
          key: subId,
          userId: uidOther,
          content: "deep subreply",
          authorDisplay: "Anonymous User",
          parentPostId: postId,
          parentReplyId: replyId,
        }),
      });

      await assertSucceeds(
        dbUpdate(
          userDb(uid),
          "/",
          buildDeleteUpdates(
            { id: postId, parentPostId: undefined, parentReplyId: undefined },
            uid,
          ),
        ),
      );

      // children survive client-side delete
      expect(
        (await dbGet(guestDb(), `replies/${postId}/${replyId}`)).exists(),
      ).toBe(true);
      expect(
        (
          await dbGet(guestDb(), `subreplies/${postId}/${replyId}/${subId}`)
        ).exists(),
      ).toBe(true);
    });

    // -- Replies ------------------------------------------------------------

    it("deletes an anonymous reply (no subreplies)", async () => {
      const postId = "rp_parent";
      const replyId = "rp_del";

      await seedContent({
        ...buildCreateUpdates({
          key: postId,
          userId: uid,
          content: "parent",
          authorDisplay: "Anonymous User",
        }),
        ...buildCreateUpdates({
          key: replyId,
          userId: uid,
          content: "reply to delete",
          authorDisplay: "Anonymous User",
          parentPostId: postId,
          score: 0,
        }),
      });

      await assertSucceeds(
        dbUpdate(
          userDb(uid),
          "/",
          buildDeleteUpdates(
            { id: replyId, parentPostId: postId, parentReplyId: undefined },
            uid,
          ),
        ),
      );

      const snap = await dbGet(guestDb(), `replies/${postId}/${replyId}`);
      expect(snap.exists()).toBe(false);
    });

    it("deletes a non-anonymous reply (no subreplies)", async () => {
      const postId = "rp_parent2";
      const replyId = "rp_del_named";

      await seedContent({
        ...buildCreateUpdates({
          key: postId,
          userId: uid,
          content: "parent",
          authorDisplay: "Anonymous User",
        }),
        ...buildCreateUpdates({
          key: replyId,
          userId: uid,
          content: "named reply",
          authorDisplay: "Real Person",
          parentPostId: postId,
          score: 1,
        }),
      });

      await assertSucceeds(
        dbUpdate(
          userDb(uid),
          "/",
          buildDeleteUpdates(
            { id: replyId, parentPostId: postId, parentReplyId: undefined },
            uid,
          ),
        ),
      );

      const snap = await dbGet(guestDb(), `replies/${postId}/${replyId}`);
      expect(snap.exists()).toBe(false);
    });

    it("deletes a reply that has subreplies (subreplies survive)", async () => {
      const postId = "rp_cas_post";
      const replyId = "rp_cas_reply";
      const subId = "rp_cas_sub";

      await seedContent({
        ...buildCreateUpdates({
          key: postId,
          userId: uid,
          content: "post",
          authorDisplay: "Anonymous User",
        }),
        ...buildCreateUpdates({
          key: replyId,
          userId: uid,
          content: "reply",
          authorDisplay: "Anonymous User",
          parentPostId: postId,
          score: 0,
        }),
        ...buildCreateUpdates({
          key: subId,
          userId: uidOther,
          content: "sub",
          authorDisplay: "Anonymous User",
          parentPostId: postId,
          parentReplyId: replyId,
        }),
      });

      await assertSucceeds(
        dbUpdate(
          userDb(uid),
          "/",
          buildDeleteUpdates(
            { id: replyId, parentPostId: postId, parentReplyId: undefined },
            uid,
          ),
        ),
      );

      // subreply survives client-side delete (cloud function cascades)
      const subSnap = await dbGet(
        guestDb(),
        `subreplies/${postId}/${replyId}/${subId}`,
      );
      expect(subSnap.exists()).toBe(true);
    });

    // -- Sub-Replies --------------------------------------------------------

    it("deletes an anonymous sub-reply", async () => {
      const postId = "sr_post";
      const replyId = "sr_reply";
      const subId = "sr_del";

      await seedContent({
        ...buildCreateUpdates({
          key: postId,
          userId: uid,
          content: "post",
          authorDisplay: "Anonymous User",
        }),
        ...buildCreateUpdates({
          key: replyId,
          userId: uid,
          content: "reply",
          authorDisplay: "Anonymous User",
          parentPostId: postId,
          score: 0,
        }),
        ...buildCreateUpdates({
          key: subId,
          userId: uidOther,
          content: "sub to delete",
          authorDisplay: "Anonymous User",
          parentPostId: postId,
          parentReplyId: replyId,
        }),
      });

      await assertSucceeds(
        dbUpdate(
          userDb(uidOther),
          "/",
          buildDeleteUpdates(
            { id: subId, parentPostId: postId, parentReplyId: replyId },
            uidOther,
          ),
        ),
      );

      const snap = await dbGet(
        guestDb(),
        `subreplies/${postId}/${replyId}/${subId}`,
      );
      expect(snap.exists()).toBe(false);
    });

    it("deletes a non-anonymous sub-reply", async () => {
      const postId = "sr_post2";
      const replyId = "sr_reply2";
      const subId = "sr_del_named";

      await seedContent({
        ...buildCreateUpdates({
          key: postId,
          userId: uid,
          content: "post",
          authorDisplay: "Anonymous User",
        }),
        ...buildCreateUpdates({
          key: replyId,
          userId: uid,
          content: "reply",
          authorDisplay: "Anonymous User",
          parentPostId: postId,
          score: 0,
        }),
        ...buildCreateUpdates({
          key: subId,
          userId: uidOther,
          content: "named sub",
          authorDisplay: "Named Person",
          parentPostId: postId,
          parentReplyId: replyId,
        }),
      });

      await assertSucceeds(
        dbUpdate(
          userDb(uidOther),
          "/",
          buildDeleteUpdates(
            { id: subId, parentPostId: postId, parentReplyId: replyId },
            uidOther,
          ),
        ),
      );

      const snap = await dbGet(
        guestDb(),
        `subreplies/${postId}/${replyId}/${subId}`,
      );
      expect(snap.exists()).toBe(false);
    });

    // -- Permission Denials -------------------------------------------------

    it("denies deletion by wrong user", async () => {
      await seedContent(
        buildCreateUpdates({
          key: "no_del",
          userId: uid,
          content: "not yours",
          authorDisplay: "Anonymous User",
        }),
      );

      await assertFails(
        dbUpdate(
          userDb(uidOther),
          "/",
          buildDeleteUpdates(
            { id: "no_del", parentPostId: undefined, parentReplyId: undefined },
            uidOther,
          ),
        ),
      );
    });

    it("denies deletion by guest", async () => {
      await seedContent(
        buildCreateUpdates({
          key: "no_del_guest",
          userId: uid,
          content: "not yours",
          authorDisplay: "Anonymous User",
        }),
      );

      await assertFails(
        dbUpdate(
          guestDb(),
          "/",
          buildDeleteUpdates(
            {
              id: "no_del_guest",
              parentPostId: undefined,
              parentReplyId: undefined,
            },
            uid,
          ),
        ),
      );
    });
  });

  // =========================================================================
  // EDIT TESTS
  // =========================================================================

  describe("Edit", () => {
    const postId = "edit_post";
    const replyId = "edit_reply";
    const subId = "edit_sub";

    beforeEach(async () => {
      await testEnv.clearDatabase();
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = dbFromContext(context);
        await db.ref("/").update({
          ...buildCreateUpdates({
            key: postId,
            userId: uid,
            content: "original",
            authorDisplay: "Anonymous User",
          }),
          ...buildCreateUpdates({
            key: replyId,
            userId: uid,
            content: "original reply",
            authorDisplay: "Anonymous User",
            parentPostId: postId,
            score: 0,
          }),
          ...buildCreateUpdates({
            key: subId,
            userId: uid,
            content: "original sub",
            authorDisplay: "Anonymous User",
            parentPostId: postId,
            parentReplyId: replyId,
          }),
        });
      });
    });

    it("allows owner to edit postContent and editedAt on a post", async () => {
      const updates = buildEditUpdates(
        { id: postId, parentPostId: undefined, parentReplyId: undefined },
        { postContent: "updated content", editedAt: Date.now() },
      );

      await assertSucceeds(dbUpdate(userDb(uid), "/", updates));

      const snap = await dbGet(guestDb(), `posts/${postId}`);
      expect(snap.val().postContent).toBe("updated content");
    });

    it("allows owner to edit a reply", async () => {
      const updates = buildEditUpdates(
        { id: replyId, parentPostId: postId, parentReplyId: undefined },
        { postContent: "updated reply", editedAt: Date.now() },
      );

      await assertSucceeds(dbUpdate(userDb(uid), "/", updates));

      const snap = await dbGet(guestDb(), `replies/${postId}/${replyId}`);
      expect(snap.val().postContent).toBe("updated reply");
    });

    it("allows owner to edit a sub-reply", async () => {
      const updates = buildEditUpdates(
        { id: subId, parentPostId: postId, parentReplyId: replyId },
        { postContent: "updated sub", editedAt: Date.now() },
      );

      await assertSucceeds(dbUpdate(userDb(uid), "/", updates));

      const snap = await dbGet(
        guestDb(),
        `subreplies/${postId}/${replyId}/${subId}`,
      );
      expect(snap.val().postContent).toBe("updated sub");
    });

    it("denies non-owner from editing", async () => {
      const updates = buildEditUpdates(
        { id: postId, parentPostId: undefined, parentReplyId: undefined },
        { postContent: "hacked", editedAt: Date.now() },
      );

      await assertFails(dbUpdate(userDb(uidOther), "/", updates));
    });

    it("denies guest from editing", async () => {
      const updates = buildEditUpdates(
        { id: postId, parentPostId: undefined, parentReplyId: undefined },
        { postContent: "hacked", editedAt: Date.now() },
      );

      await assertFails(dbUpdate(guestDb(), "/", updates));
    });
  });

  // =========================================================================
  // SHARE URL TESTS
  // =========================================================================

  describe("Share URL (buildShareUrl)", () => {
    const origin = "https://theopendissent.com";

    it("builds correct URL for a top-level post", () => {
      const url = buildShareUrl(
        { id: "abc", parentPostId: undefined, parentReplyId: undefined },
        origin,
      );
      expect(url).toBe("https://theopendissent.com/share?s=abc");
    });

    it("builds correct URL for a reply", () => {
      const url = buildShareUrl(
        { id: "reply1", parentPostId: "post1", parentReplyId: undefined },
        origin,
      );
      expect(url).toBe(
        "https://theopendissent.com/share?s=reply1&p=post1",
      );
    });

    it("builds correct URL for a sub-reply", () => {
      const url = buildShareUrl(
        { id: "sub1", parentPostId: "post1", parentReplyId: "reply1" },
        origin,
      );
      expect(url).toBe(
        "https://theopendissent.com/share?s=sub1&p=reply1&r=post1",
      );
    });
  });
});
