import { memo } from "react";
import { Notification } from "../../lib/notificationStore";
import { timeAgo } from "../../utils";

interface NotificationItemProps {
  notification: Notification;
  selected: boolean;
  isSelecting: boolean;
  onToggle: (id: string) => void;
  onClick: (notification: Notification) => void;
}

export const NotificationItem = memo(
  ({
    notification,
    selected,
    isSelecting,
    onToggle,
    onClick,
  }: NotificationItemProps) => {
    const formattedTime = timeAgo(new Date(notification.updatedAt));

    const renderMessage = () => {
      if (notification.type === "reply") {
        const count = notification.count || 1;
        return (
          <span className="text-slate-800 leading-snug">
            <strong>{count === 1 ? "Someone" : `${count} people`}</strong>{" "}
            replied to your post.
          </span>
        );
      }
      if (notification.type === "invitation") {
        return (
          <strong className="text-slate-900">Invitation to the show</strong>
        );
      }
      return <span className="text-slate-600">New notification</span>;
    };

    return (
      <div
        onClick={() => onClick(notification)}
        className={
          "group flex items-center gap-4 p-4 border border-border-subtle shadow-md rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.99] bg-white"
        }
      >
        <div
          className="flex items-center justify-center shrink-0 w-6 h-6"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(notification.id);
          }}
        >
          {isSelecting ? (
            <div
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                selected ? "bg-logo-blue border-logo-blue" : "border-slate-400"
              }`}
            >
              {selected && (
                <i className="bi bi-check-lg text-white text-xs"></i>
              )}
            </div>
          ) : (
            <i className="bi bi-bell text-slate-400 text-lg"></i>
          )}
        </div>

        {/* Text Section */}
        <div className="flex flex-col flex-1 gap-0.5">
          <p className="text-slate-800 leading-[1.6] whitespace-pre-wrap wrap-break-word text-sm">
            {renderMessage()}
          </p>
          <div className="flex items-center gap-2">
            <span className="aspect-square h-2.5 w-auto flex-none rounded-full bg-logo-red animate-pulse" />
            <span className="flex items-center flex-wrap gap-1 text-[0.7rem] text-slate-400 font-medium tracking-tight">
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Arrow Visual */}
        <div className="text-slate-300 group-hover:text-logo-blue transition-colors pr-1">
          <i className="bi bi-chevron-right"></i>
        </div>
      </div>
    );
  },
);
