import { useState, useEffect } from "react";
import { notificationStore, Notification } from "../lib/notificationStore";
import { useAuth } from "../context/AuthContext";

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(
    notificationStore.getAll(),
  );
  const [unreadCount, setUnreadCount] = useState(
    notificationStore.getUnreadCount(),
  );

  useEffect(() => {
    // subscribe to the store's internal state changes
    return notificationStore.subscribe((newList) => {
      setNotifications(newList);
      setUnreadCount(notificationStore.getUnreadCount());
    });
  }, []);

  const markAsRead = (id: string) => {
    if (user) notificationStore.markAsRead(user.uid, id);
  };

  const removeBatch = (ids: string[]) => {
    if (user) notificationStore.remove(user.uid, ids);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    removeBatch,
  };
};
