import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationItem } from "../components/notifications/NotificationItem";
import { motion } from "framer-motion";

export const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, markAsRead, removeBatch } = useNotifications();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)));
    }
  };

  const handleDeleteSelected = () => {
    removeBatch(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleNotifClick = (id: string, targetId: string, type: string) => {
    markAsRead(id);
    removeBatch([id]);
    if (type === "reply") navigate(`/post/${targetId}`);
  };

  return (
    <div className="flex flex-col gap-3 pb-10">
      {/* Header Grid - Modeled after Profile */}
      <div className="grid grid-cols-1 items-center w-full">
        <h1 className="my-2 col-start-1 row-start-1 justify-self-center text-xl font-bold text-slate-900 tracking-tight text-nowrap">
          Notifications
        </h1>
      </div>

      {/* Action Row - Aligned with subtitle style */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between px-1 mb-1">
          <button
            onClick={toggleAll}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider transition-colors"
          >
            {selectedIds.size === notifications.length
              ? "Deselect All"
              : "Select All"}
          </button>

          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="text-[11px] font-bold text-logo-red hover:text-red-700 uppercase tracking-wider transition-colors"
            >
              Delete ({selectedIds.size})
            </button>
          )}
        </div>
      )}

      {/* Notification List */}
      <div className="flex flex-col gap-3">
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            className="flex flex-col items-center justify-center py-10"
          >
            <span className="text-slate-500 text-[11px] font-bold tracking-wider uppercase">
              All caught up!
            </span>
          </motion.div>
        ) : (
          notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              selected={selectedIds.has(notif.id)}
              onToggle={toggleSelect}
              onClick={handleNotifClick}
            />
          ))
        )}
      </div>
    </div>
  );
};
