import { describe, expect, it, vi } from "vitest";
import { notificationStore, Notification } from "../src/lib/notificationStore";

const firebase = vi.hoisted(() => ({
  emit: (_: Notification[]) => {},
}));

vi.mock("../src/lib/firebase", () => ({
  subscribeToNotifications: (
    _: string,
    callback: (notifications: Notification[]) => void,
  ) => {
    firebase.emit = callback;
    return () => {};
  },
  markNotificationAsRead: vi.fn(async () => {}),
  deleteNotifications: vi.fn(async () => {}),
}));

const notif = (id: string, fields: Partial<Notification>): Notification => ({
  id,
  type: "reply",
  count: 1,
  isRead: false,
  createdAt: 0,
  updatedAt: 0,
  ...fields,
});

const ids = () => notificationStore.getAll().map((n) => n.id);

describe("notificationStore", () => {
  it("keeps pinned notifications above newer and unread ones", () => {
    notificationStore.init("uid");
    firebase.emit([
      notif("read", { isRead: true, updatedAt: 1 }),
      notif("unread", { updatedAt: 2 }),
      notif("pinned", { pinned: true, isRead: true, updatedAt: 0 }),
    ]);

    expect(ids()).toEqual(["pinned", "unread", "read"]);
  });

  it("keeps a pinned notification on top after it is read", () => {
    notificationStore.init("uid");
    firebase.emit([
      notif("unread", { updatedAt: 2 }),
      notif("pinned", { pinned: true, updatedAt: 1 }),
    ]);

    notificationStore.markAsRead("uid", "pinned");

    expect(ids()).toEqual(["pinned", "unread"]);
  });

  it("orders pinned notifications unread first, then newest", () => {
    notificationStore.init("uid");
    firebase.emit([
      notif("old", { pinned: true, updatedAt: 1 }),
      notif("new", { pinned: true, updatedAt: 2 }),
      notif("read", { pinned: true, isRead: true, updatedAt: 3 }),
    ]);

    expect(ids()).toEqual(["new", "old", "read"]);
  });
});
