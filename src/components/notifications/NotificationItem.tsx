import { memo } from "react";
import { Notification } from "../../lib/notificationStore";
import { timeAgo } from "../../utils";

interface NotificationItemProps {
  notification: Notification;
  selected: boolean;
  onToggle: (id: string) => void;
  onClick: (id: string, targetId: string, type: string) => void;
}

export const NotificationItem = memo(
  ({ notification, selected, onToggle, onClick }: NotificationItemProps) => {
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
        onClick={() =>
          onClick(notification.id, notification.id, notification.type)
        }
        className={`group flex items-center gap-4 p-4 bg-white border border-border-subtle shadow-sm rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.99] ${!notification.isRead ? "bg-slate-50/30" : "bg-white"}
      `}
      >
        {/* Checkbox Section */}
        <div
          className="flex items-center justify-center shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(notification.id);
          }}
        >
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
              selected
                ? "bg-logo-blue border-logo-blue"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            {selected && <i className="bi bi-check-lg text-white text-xs"></i>}
          </div>
        </div>

        {/* Text Section */}
        <div className="flex flex-col flex-1 gap-0.5">
          <p
            className={`text-slate-800 leading-[1.6] whitespace-pre-wrap wrap-break-word`}
          >
            {renderMessage()}
          </p>
          <div className="flex items-center gap-2">
            <span className="flex items-center flex-wrap gap-1 text-[10px] text-slate-400 font-medium tracking-tight">
              {formattedTime}
            </span>
            {!notification.isRead && (
              <span className="w-2 h-2 rounded-full bg-logo-red animate-pulse" />
            )}
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
