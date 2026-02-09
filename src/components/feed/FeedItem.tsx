import { memo, useState } from "react";
import { Post } from "../../types";
import { timeAgo } from "../../utils";
import { usePostActions } from "../../hooks/usePostActions";
import { useShare } from "../../hooks/useShare";
import { useReport } from "../../hooks/useReport";
import { useNavigate } from "react-router-dom";

interface FeedItemProps {
  item: Post;
  isReply?: boolean;
  highlighted?: boolean;
  disableClick?: boolean;
  onStanceChange?: (stance: "agreed" | "dissented" | null) => void;
}

export const FeedItem = memo(
  ({
    item,
    isReply = false,
    highlighted = false,
    disableClick = false,
    onStanceChange,
  }: FeedItemProps) => {
    if (!item || !item.userId) return null;

    const navigate = useNavigate();
    const { sharePost } = useShare();
    const { reportPost } = useReport();
    const [isJiggling, setIsJiggling] = useState(false);

    const {
      uid,
      localMetrics,
      isEditing,
      setIsEditing,
      editContent,
      setEditContent,
      isSaving,
      interactionState,
      toggleInteraction,
      saveEdit,
      handleCancel,
      triggerDelete,
    } = usePostActions(item);

    // --- Derived State & Logic ---
    const isOwner = uid === item.userId;
    const activeStance = interactionState.dissented
      ? "dissented"
      : interactionState.agreed
        ? "agreed"
        : null;
    const charsLeft = 600 - editContent.length;
    const isNearLimit = charsLeft < 50;

    // Stance of the author (Only relevant for replies)
    const authorAgreed = item.userInteractionType === "agreed";
    const stanceColorClass = authorAgreed ? "text-logo-green" : "text-logo-red";
    const stanceBgClass = authorAgreed
      ? "bg-logo-green-light"
      : "bg-logo-red-light";
    const stanceIconClass = authorAgreed
      ? "bi-check-square-fill"
      : "bi-x-square-fill";

    const formattedTime = timeAgo(
      new Date(typeof item.timestamp === "number" ? item.timestamp : 0),
    );
    const formattedEditTime = item.editedAt
      ? timeAgo(new Date(item.editedAt))
      : null;

    // --- Handlers ---
    const triggerJiggle = () => {
      setIsJiggling(false);
      window.requestAnimationFrame(() => setIsJiggling(true));
      setTimeout(() => setIsJiggling(false), 500);
    };

    const onStanceClick = (
      e: React.MouseEvent,
      type: "agreed" | "dissented",
    ) => {
      e.stopPropagation();
      const wasNeutral = !activeStance;
      const success = toggleInteraction(type);

      if (success && wasNeutral) {
        triggerJiggle();
        if (onStanceChange) {
          onStanceChange(activeStance === type ? null : type);
        }
      }
    };

    const handleAction = (e: React.MouseEvent, action: () => void) => {
      e.stopPropagation();
      action();
    };

    return (
      <div
        className={`flex flex-col gap-4 p-4 bg-white border transition-all duration-200 rounded-(--radius-modal) ${
          highlighted
            ? "border-logo-blue ring-2 ring-logo-blue/10 shadow-md scale-[1.01]"
            : "border-border-subtle shadow-sm"
        }`}
      >
        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {/* CONDITIONAL AVATAR */}
            {!isReply ? (
              <div className="w-9 h-9 bg-slate-100 rounded-md flex items-center justify-center text-slate-500 shrink-0 border border-slate-200/50">
                <i className="bi bi-person-fill"></i>
              </div>
            ) : (
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-md ${stanceBgClass} shrink-0`}
              >
                <i
                  className={`bi ${stanceIconClass} ${stanceColorClass} text-[14px]`}
                ></i>
              </div>
            )}

            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900 leading-tight">
                {isOwner ? "You" : item.userId.substring(0, 10) + "..."}
              </span>
              <div className="flex items-center flex-wrap gap-1 text-[10px] text-slate-400 font-medium tracking-tight">
                {isReply && (
                  <span className={`${stanceColorClass} font-bold opacity-90`}>
                    {authorAgreed ? "Agreed" : "Dissented"} ·
                  </span>
                )}
                <span>{formattedTime}</span>
                {formattedEditTime && (
                  <span className="flex items-center italic">
                    <span className="mx-1">·</span> edited {formattedEditTime}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Top-Right Actions */}
          <div className="flex items-center">
            {isOwner ? (
              <button
                onClick={(e) => handleAction(e, () => setIsEditing(true))}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-logo-blue hover:bg-slate-50 transition-colors"
              >
                <i className="bi bi-pencil-square text-[14px]"></i>
              </button>
            ) : uid ? (
              <button
                onClick={(e) =>
                  handleAction(e, () => uid && reportPost(item.id, uid))
                }
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-logo-red hover:bg-slate-50 transition-colors"
              >
                <i className="bi bi-flag text-[14px]"></i>
              </button>
            ) : (
              <></>
            )}
          </div>
        </div>

        {/* CONTENT AREA */}
        {isEditing ? (
          <div
            className="flex flex-col gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <textarea
                autoFocus
                maxLength={600}
                className="resize-none custom-scrollbar w-full p-3 pr-6 border border-border-subtle rounded-(--radius-input) outline-none min-h-24 text-[15px] focus:border-logo-blue focus:ring-1 focus:ring-logo-blue/10 transition-all"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                disabled={isSaving}
              />
              <span
                className={`absolute right-2 bottom-2 text-[10px] font-bold uppercase ${isNearLimit ? "text-logo-red" : "text-slate-300"}`}
              >
                {charsLeft}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  className="px-4 py-1.5 bg-logo-blue text-white rounded-(--radius-button) text-sm font-semibold disabled:opacity-50"
                  onClick={(e) => handleAction(e, saveEdit)}
                  disabled={isSaving || !editContent.trim()}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-(--radius-button) text-sm font-semibold"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
              <button
                className="w-8 h-8 flex items-center justify-center text-slate-400 rounded-full hover:text-red-400 hover:bg-red-50"
                onClick={(e) => handleAction(e, triggerDelete)}
              >
                <i className="bi bi-trash3 text-[16px]"></i>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-slate-800 leading-[1.6] whitespace-pre-wrap wrap-break-word">
            {item.postContent}
          </p>
        )}

        {/* FOOTER */}
        <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
          <div className="flex items-center gap-3">
            {/* Interaction Pill */}
            <div className="relative flex items-center bg-slate-50 p-0.5 rounded-full border border-border-subtle">
              <div
                className={`absolute h-7 rounded-full transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) z-0
                ${activeStance === "agreed" ? "translate-x-0 bg-logo-green" : ""}
                ${activeStance === "dissented" ? "translate-x-[102%] bg-logo-red" : ""}
                ${!activeStance ? "translate-x-[51%] opacity-0 scale-50" : "opacity-100 scale-100"}
              `}
                style={{ left: "2px", width: "48%" }}
              />
              <button
                onClick={(e) => onStanceClick(e, "agreed")}
                className={`cursor-pointer relative z-10 px-3 py-1 flex items-center gap-1.5 rounded-full active:scale-95 transition-all
                ${activeStance === "agreed" ? "text-white" : "text-slate-400 hover:text-logo-green"}`}
              >
                <i className="bi bi-check2 text-[16px]"></i>
                <span className="text-[12px] font-bold">
                  {localMetrics.agreedCount}
                </span>
              </button>

              <button
                onClick={(e) => onStanceClick(e, "dissented")}
                className={`cursor-pointer relative z-10 px-3 py-1 flex items-center gap-1.5 rounded-full active:scale-95 transition-all
                ${activeStance === "dissented" ? "text-white" : "text-slate-400 hover:text-logo-red"}`}
              >
                <i className="bi bi-x-lg text-[14px]"></i>
                <span className="text-[12px] font-bold">
                  {localMetrics.dissentedCount}
                </span>
              </button>
            </div>

            {/* Discussion Button (Conditional) */}
            {!isReply && (
              <button
                onClick={(e) =>
                  handleAction(
                    e,
                    () => !disableClick && navigate(`/post/${item.id}`),
                  )
                }
                disabled={disableClick}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full origin-center active:scale-95 transition-all
    ${isJiggling ? "animate-jiggle shadow-md ring-2 ring-logo-blue/10" : ""}
    ${disableClick ? "text-logo-blue" : "text-slate-400 hover:bg-slate-50 hover:text-logo-blue"}`}
              >
                <i
                  className={`bi ${disableClick ? "bi-chat-fill" : "bi-chat"} text-[14px]`}
                ></i>
                <span className="text-[13px] font-bold">
                  {localMetrics.replyCount}
                </span>
              </button>
            )}
          </div>

          <button
            onClick={(e) => handleAction(e, () => sharePost(item))}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-slate-400 hover:bg-slate-50 hover:text-logo-blue active:scale-95 transition-all"
          >
            <i className="bi bi-box-arrow-up text-[15px]"></i>
          </button>
        </div>
      </div>
    );
  },
  (p, n) =>
    p.item.id === n.item.id &&
    p.item.postContent === n.item.postContent &&
    p.item.replyCount === n.item.replyCount &&
    p.item.editedAt === n.item.editedAt &&
    p.highlighted === n.highlighted &&
    JSON.stringify(p.item.userInteractions) ===
      JSON.stringify(n.item.userInteractions),
);
