import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  RulesTestEnvironment,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { contactAuthor, sendContactNotification } from "../functions/index.js";

const PROJECT_ID = "the-open-dissent-prod";
// own namespace: other suites wipe the shared one while running in parallel
const DB_NAME = "admin-contact-test";
let uid = "";
let nextUid = 0;

let testEnv: RulesTestEnvironment;

/** runs the callable's handler directly with the given auth token */
const callContact = (token: Record<string, unknown>, data: unknown) =>
  (contactAuthor as any).run({ auth: { uid: "caller", token }, data });

describe("Admin contact notifications", () => {
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

  beforeEach(() => {
    uid = `author_user_${nextUid++}`;
  });

  /** seeds a lookup entry, contacts its author twice, and returns the stored notifications */
  const contact = async (lookup: Record<string, string>, id: string) => {
    let notifications: any[] = [];
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.database(`http://127.0.0.1:9000?ns=${DB_NAME}`) as any;
      await db.ref(`authorLookup/${id}`).set(lookup);
      await sendContactNotification(id, "hello", db);
      await sendContactNotification(id, "hello again", db);
      const snap = await db.ref(`users/${uid}/notifications`).once("value");
      notifications = Object.values(snap.val());
    });
    return notifications;
  };

  it("pins a separate notification for each contact", async () => {
    const notifications = await contact({ uid, type: "post" }, "post_1");

    expect(notifications).toHaveLength(2);
    expect(notifications.map((n) => n.message)).toEqual([
      "hello",
      "hello again",
    ]);
    expect(notifications[0]).toMatchObject({
      type: "contact",
      pinned: true,
      isRead: false,
      targetType: "post",
      targetPath: "/post/post_1",
    });
  });

  it("links to a reply", async () => {
    const [notification] = await contact(
      { uid, type: "reply", postId: "post_1" },
      "reply_1",
    );

    expect(notification).toMatchObject({
      targetType: "reply",
      targetPath: "/post/post_1?reply=reply_1",
    });
  });

  it("links to a sub-reply", async () => {
    const [notification] = await contact(
      { uid, type: "subreply", postId: "post_1", replyId: "reply_1" },
      "sub_1",
    );

    expect(notification).toMatchObject({
      targetType: "reply",
      targetPath: "/post/post_1?reply=reply_1&subreply=sub_1",
    });
  });

  it("fails when the content has no author", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.database(`http://127.0.0.1:9000?ns=${DB_NAME}`) as any;
      await expect(
        sendContactNotification("missing", "hello", db),
      ).rejects.toMatchObject({ code: "not-found" });
    });
  });

  it("rejects callers without the admin claim", async () => {
    await expect(
      callContact({}, { contentId: "post_1" }),
    ).rejects.toMatchObject({ code: "permission-denied" });
    await expect(
      callContact({ admin: "true" }, { contentId: "post_1" }),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("rejects signed-out callers", async () => {
    await expect(
      (contactAuthor as any).run({ data: { contentId: "post_1" } }),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("rejects a missing content id and an overlong message", async () => {
    await expect(callContact({ admin: true }, {})).rejects.toMatchObject({
      code: "invalid-argument",
    });
    await expect(
      callContact(
        { admin: true },
        { contentId: "post_1", message: "a".repeat(501) },
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });
});
