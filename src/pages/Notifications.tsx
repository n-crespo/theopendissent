import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationItem } from "../components/notifications/NotificationItem";
import { Notification } from "../lib/notificationStore";
import { motion } from "framer-motion";
import { SEO } from "../components/ui/Seo";

export const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, markAsRead, removeBatch } = useNotifications();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false); // new state for selection mode
  const deletable = notifications.filter((n) => !n.pinned);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === deletable.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deletable.map((n) => n.id)));
    }
  };

  const handleCancel = () => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    removeBatch(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsSelecting(false);
  };

  const handleNotifClick = (notification: Notification) => {
    const { id, type, latestReplyId, isRead, parentPostId, pinned, targetPath } =
      notification;

    if (isSelecting) {
      if (!pinned) toggleSelect(id);
      return;
    }

    if (!isRead) markAsRead(id);

    if (type === "contact" && targetPath) {
      navigate(targetPath);
    } else if (type === "reply") {
      if (parentPostId) {
        // its a subreply notification
        // id = parentReplyId, latestReplyId = subReplyId
        navigate(`/post/${parentPostId}?reply=${id}&subreply=${latestReplyId}`);
      } else {
        // its a top-level reply notification
        const path = latestReplyId
          ? `/post/${id}?reply=${latestReplyId}`
          : `/post/${id}`;
        navigate(path);
      }
    }
  };

  return (
    <div className="flex flex-col gap-3 pb-10">
      <div className="grid grid-cols-1 items-center w-full">
        <SEO title="Notifications" description="Your Notifications" />
        <h1 className="my-2 col-start-1 row-start-1 justify-self-center text-xl font-bold text-stone-900 tracking-tight text-nowrap">
          Notifications
        </h1>
      </div>

      {deletable.length > 0 && (
        <div className="flex items-center justify-between px-1 mb-1">
          {/* bulk selection toggle on the left */}
          <div className="flex">
            {isSelecting && (
              <button
                onClick={toggleAll}
                className="text-2xs font-bold text-logo-blue uppercase tracking-wider transition-colors"
              >
                {selectedIds.size === deletable.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            )}
          </div>

          {/* action buttons grouped on the right */}
          <div className="flex gap-4">
            {selectedIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="text-2xs font-bold text-logo-red hover:text-red-700 uppercase tracking-wider transition-colors"
              >
                Delete ({selectedIds.size})
              </button>
            )}

            <button
              onClick={isSelecting ? handleCancel : () => setIsSelecting(true)}
              className="text-2xs font-bold text-stone-400 hover:text-stone-600 uppercase tracking-wider transition-colors"
            >
              {isSelecting ? "Cancel" : "Select"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            className="flex flex-col items-center justify-center py-10"
          >
            <span className="text-stone-500 text-2xs font-bold tracking-wider uppercase">
              All caught up!
            </span>
          </motion.div>
        ) : (
          notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              selected={selectedIds.has(notif.id)}
              isSelecting={isSelecting}
              onToggle={toggleSelect}
              onClick={handleNotifClick}
            />
          ))
        )}
      </div>
    </div>
  );
};
