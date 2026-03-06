import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationItem } from "../components/notifications/NotificationItem";
import { motion } from "framer-motion";

export const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, markAsRead, removeBatch } = useNotifications();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false); // new state for selection mode

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

  const handleCancel = () => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    removeBatch(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsSelecting(false);
  };

  const handleNotifClick = (id: string, targetId: string, type: string) => {
    // only navigate if not in selection mode
    if (isSelecting) {
      toggleSelect(id);
      return;
    }
    // markAsRead(id);
    removeBatch([id]);
    if (type === "reply") navigate(`/post/${targetId}`);
  };

  return (
    <div className="flex flex-col gap-3 pb-10">
      <div className="grid grid-cols-1 items-center w-full">
        <h1 className="my-2 col-start-1 row-start-1 justify-self-center text-xl font-bold text-slate-900 tracking-tight text-nowrap">
          Notifications
        </h1>
      </div>

      {notifications.length > 0 && (
        <div className="flex items-center justify-between px-1 mb-1">
          <div className="flex gap-4">
            {/* select / cancel toggle */}
            <button
              onClick={isSelecting ? handleCancel : () => setIsSelecting(true)}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider transition-colors"
            >
              {isSelecting ? "Cancel" : "Select"}
            </button>

            {/* select all appears only when isSelecting is true */}
            {isSelecting && (
              <button
                onClick={toggleAll}
                className="text-[11px] font-bold text-logo-blue uppercase tracking-wider transition-colors"
              >
                {selectedIds.size === notifications.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            )}
          </div>

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
