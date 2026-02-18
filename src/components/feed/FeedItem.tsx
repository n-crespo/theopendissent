import { memo, useState } from "react";
import { Post } from "../../types";
import { timeAgo } from "../../utils";
import { usePostActions } from "../../hooks/usePostActions";
import { useShare } from "../../hooks/useShare";
import { useReport } from "../../hooks/useReport";
import { useNavigate } from "react-router-dom";
import { InteractionSlider } from "../ui/InteractionSlider";

interface FeedItemProps {
  item: Post;
  isReply?: boolean;
  highlighted?: boolean;
  disableClick?: boolean;
  onInteraction?: (score: number) => void;
}

export const FeedItem = memo(
  ({
    item,
    isReply = false,
    highlighted = false,
    disableClick = false,
    onInteraction,
  }: FeedItemProps) => {
    if (!item || !item.userId) return null;

    const navigate = useNavigate();
    const { sharePost } = useShare();
    const { reportPost } = useReport();

    // Derived Local State for animations (if needed later)
    const [isJiggling, setIsJiggling] = useState(false);

    const {
      uid,
      localMetrics, // only contains replyCount
      currentScore, // scalar score (-5 to 5)
      handleScoreChange,

      isEditing,
      setIsEditing,
      editContent,
      setEditContent,
      isSaving,
      saveEdit,
      handleCancel,
      triggerDelete,
    } = usePostActions(item);

    // --- Derived State & Logic ---
    const isOwner = uid === item.userId;
    const charsLeft = 600 - editContent.length;
    const isNearLimit = charsLeft < 50;

    // --- Reply Indicator Logic ---
    // Visualizing the author's score on the parent post
    const replyScore = item.interactionScore ?? 0;

    const getReplyBadgeStyle = (val: number) => {
      if (val > 0) return "bg-green-100 text-green-700 border-green-200";
      if (val < 0) return "bg-red-100 text-red-700 border-red-200";
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    };

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

    const onSliderChange = (val: number) => {
      const isNewInteraction = currentScore === undefined;

      handleScoreChange(val);

      if (onInteraction) onInteraction(val);

      if (isNewInteraction) triggerJiggle();
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
            {/* AVATAR */}
            <div className="w-9 h-9 bg-slate-100 rounded-md flex items-center justify-center text-slate-500 shrink-0 border border-slate-200/50">
              <i className="bi bi-person-fill"></i>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 leading-tight">
                  {isOwner ? "You" : item.userId.substring(0, 10) + "..."}
                </span>

                {/* reply indicator badge */}
                {isReply && item.interactionScore !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getReplyBadgeStyle(replyScore)}`}
                  >
                    {replyScore > 0 ? "+" : ""}
                    {replyScore}
                  </span>
                )}
              </div>

              <div className="flex items-center flex-wrap gap-1 text-[10px] text-slate-400 font-medium tracking-tight">
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
            ) : null}
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

        {/* post footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border-subtle gap-4">
          {/* slider */}
          <div className="flex-1 max-w-50" onClick={(e) => e.stopPropagation()}>
            <InteractionSlider
              value={currentScore}
              onChange={onSliderChange}
              disabled={isOwner || !uid}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Discussion Button */}
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
                  className={`bi ${disableClick ? "bi-chat-fill" : "bi-chat"} text-[16px]`}
                ></i>
                {localMetrics.replyCount > 0 && (
                  <span className="text-[13px] font-bold">
                    {localMetrics.replyCount}
                  </span>
                )}
              </button>
            )}

            {/* Share Button */}
            <button
              onClick={(e) => handleAction(e, () => sharePost(item))}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-slate-400 hover:bg-slate-50 hover:text-logo-blue active:scale-95 transition-all"
            >
              <i className="bi bi-box-arrow-up text-[16px]"></i>
            </button>
          </div>
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
