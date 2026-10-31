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
    const isRead = notification.isRead;
    const isPinned = !!notification.pinned;

    const renderMessage = () => {
      if (notification.type === "reply") {
        const count = notification.count || 1;
        const targetType = notification.parentPostId ? "reply" : "post";
        return (
          <span
            className={`${isRead ? "text-stone-600" : "text-stone-800"} leading-snug`}
          >
            <strong>{count === 1 ? "Someone" : `${count} people`}</strong>{" "}
            replied to your {targetType}.
          </span>
        );
      }
      if (notification.type === "invitation") {
        return (
          <strong className={isRead ? "text-stone-700" : "text-stone-900"}>
            Invitation to the show
          </strong>
        );
      }
      if (notification.type === "contact") {
        return (
          <span
            className={`${isRead ? "text-stone-600" : "text-stone-800"} leading-snug`}
          >
            <strong>An admin</strong> contacted you about your{" "}
            {notification.targetType ?? "post"}.
            {notification.message && (
              <span className="block mt-1">{notification.message}</span>
            )}
          </span>
        );
      }
      return <span className="text-stone-600">New notification</span>;
    };

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onClick(notification)}
        onKeyDown={(e) => {
          // ignore keys bubbling up from the inner checkbox button
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(notification);
          }
        }}
        className={`group flex items-center gap-x-4 p-[clamp(1rem,3vw,1.25rem)] border transition-all duration-200 cursor-pointer overflow-hidden rounded-card
          ${
            isRead
              ? "bg-stone-50 border-stone-100 opacity-80"
              : "bg-white border-stone-200 shadow-sm hover:shadow-md"
          }`}
      >
        {/* Left Icon / Checkbox Section */}
        {isPinned ? (
          // pinned notifications can't be deleted, so they have no checkbox
          <span
            role="img"
            aria-label="Pinned"
            title="Pinned"
            className="flex items-center justify-center shrink-0 w-6 h-6"
          >
            <i className="bi bi-pin-angle-fill text-lg text-logo-blue"></i>
          </span>
        ) : (
          <button
            type="button"
            aria-label={
              selected ? "Deselect notification" : "Select notification"
            }
            aria-pressed={isSelecting ? selected : undefined}
            className="flex items-center justify-center shrink-0 w-6 h-6"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(notification.id);
            }}
          >
            {isSelecting ? (
              <span
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  selected
                    ? "bg-logo-blue border-logo-blue"
                    : "border-stone-400"
                }`}
              >
                {selected && (
                  <i className="bi bi-check-lg text-white text-xs"></i>
                )}
              </span>
            ) : (
              <i
                className={`bi bi-bell text-lg ${isRead ? "text-stone-300" : "text-stone-400"}`}
              ></i>
            )}
          </button>
        )}

        {/* Text Content Section */}
        <div className="flex flex-col flex-1 min-w-0 gap-0.5">
          <p className="text-stone-800 leading-[1.6] whitespace-pre-wrap wrap-break-word text-sm">
            {renderMessage()}
          </p>
          <div className="flex items-center gap-2">
            {/* Only show the pulse dot if the notification is UNREAD */}
            {!isRead && (
              <span className="aspect-square h-2.5 w-auto flex-none rounded-full bg-logo-red animate-pulse" />
            )}
            <span className="flex items-center flex-wrap gap-1 text-2xs text-stone-400 font-medium tracking-tight">
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Right Arrow Visual */}
        <div
          className={`transition-colors pr-1 ${isRead ? "text-stone-200" : "text-stone-300 group-hover:text-logo-blue"}`}
        >
          <i className="bi bi-chevron-right"></i>
        </div>
      </div>
    );
  },
);
