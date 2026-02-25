import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { timeAgo } from "../utils";

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
    removeBatch([id]);
    if (type === "reply") {
      navigate(`/post/${targetId}`);
    }
    // can add invitation logic here!
  };

  const renderMessage = (notif: any) => {
    if (notif.type === "reply") {
      const count = notif.count || 1;
      return (
        <span>
          <strong>{count === 1 ? "Someone" : `${count} people`}</strong> replied
          to your post.
        </span>
      );
    }
    if (notif.type === "invitation") {
      return <strong>Invitation to the show</strong>;
    }
    return notif.message || "New notification";
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
        {notifications.length > 0 && (
          <div className="flex items-center gap-4">
            <button
              onClick={toggleAll}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors"
            >
              {selectedIds.size === notifications.length
                ? "Deselect All"
                : "Select All"}
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="text-[11px] font-bold text-logo-red hover:text-red-700 uppercase tracking-widest transition-colors"
              >
                Delete ({selectedIds.size})
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <i className="bi bi-bell-slash text-4xl mb-3 opacity-20"></i>
            <p className="text-sm font-bold uppercase tracking-widest opacity-60">
              All caught up
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`group flex items-center gap-4 p-4 transition-colors hover:bg-slate-50 cursor-pointer
                ${!notif.isRead ? "bg-slate-50/50" : "bg-white"}
              `}
              onClick={() => handleNotifClick(notif.id, notif.id, notif.type)}
            >
              <div
                className="flex items-center justify-center pr-1"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(notif.id)}
                  onChange={() => toggleSelect(notif.id)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer transition-all"
                />
              </div>

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border
                ${notif.type === "reply" ? "bg-slate-50 border-slate-100 text-slate-600" : "bg-logo-red/5 border-logo-red/10 text-logo-red"}
              `}
              >
                <i
                  className={`bi ${notif.type === "reply" ? "bi-chat-left-text" : "bi-broadcast-pin"} text-lg`}
                ></i>
              </div>

              <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                <p
                  className={`text-[14px] leading-tight text-slate-800 ${!notif.isRead ? "font-bold" : "font-normal"}`}
                >
                  {renderMessage(notif)}
                </p>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {/* use your custom timeAgo utility */}
                  {timeAgo(new Date(notif.updatedAt))}
                </span>
              </div>

              {!notif.isRead && (
                <div className="h-2 w-2 rounded-full bg-logo-blue shrink-0 shadow-[0_0_8px_rgba(var(--logo-blue-rgb),0.5)]"></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
