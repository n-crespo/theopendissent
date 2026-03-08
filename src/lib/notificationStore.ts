import {
  subscribeToNotifications,
  markNotificationAsRead,
  deleteNotifications,
} from "./firebase";

export interface Notification {
  id: string;
  type: "reply" | "invitation";
  count: number;
  isRead: boolean;
  createdAt: number;
  updatedAt: number;
}

class NotificationStore {
  private notifications: Notification[] = [];
  private listeners: Set<(notifications: Notification[]) => void> = new Set();
  private unsubscribe: (() => void) | null = null;

  /** Initialize listener for a specific user */
  init(userId: string) {
    // Cleanup existing listener if user switches
    if (this.unsubscribe) this.unsubscribe();

    this.unsubscribe = subscribeToNotifications(userId, (data) => {
      // Apply sorting whenever fresh data arrives from Firebase
      this.notifications = this.sortNotifications(data);
      this.notify();
    });
  }

  /**  Helper to sort notifications. Unread first, then recently updated. */
  private sortNotifications(data: Notification[]): Notification[] {
    return [...data].sort((a, b) => {
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1;
      }
      return b.updatedAt - a.updatedAt;
    });
  }

  /** Get current snapshot of notifications */
  getAll(): Notification[] {
    return this.notifications;
  }

  /** Get unread count for the Header bubble */
  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  /** UI Subscription */
  subscribe(callback: (notifications: Notification[]) => void) {
    this.listeners.add(callback);
    callback(this.notifications);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /** Actions wrapper */
  async markAsRead(userId: string, notifId: string) {
    // Update the flag AND re-sort so the item drops down immediately in the UI.
    const updatedList = this.notifications.map((n) =>
      n.id === notifId ? { ...n, isRead: true } : n,
    );

    this.notifications = this.sortNotifications(updatedList);
    this.notify();

    return markNotificationAsRead(userId, notifId);
  }

  async remove(userId: string, notifIds: string[]) {
    // Optimistic update
    this.notifications = this.notifications.filter(
      (n) => !notifIds.includes(n.id),
    );
    this.notify();

    return deleteNotifications(userId, notifIds);
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.notifications));
  }

  /** Stop all listeners (useful for logout) */
  dispose() {
    if (this.unsubscribe) this.unsubscribe();
    this.notifications = [];
    this.notify();
  }
}

export const notificationStore = new NotificationStore();
