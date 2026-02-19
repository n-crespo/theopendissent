import { memo, useState } from "react";
import { Post } from "../../types";
import { timeAgo } from "../../utils";
import { usePostActions } from "../../hooks/usePostActions";
import { useShare } from "../../hooks/useShare";
import { useReport } from "../../hooks/useReport";
import { useNavigate } from "react-router-dom";
import { InteractionSlider } from "../ui/InteractionSlider";
import { getInterpolatedColor, DEFAULT_STOPS } from "../../color-utils";

interface FeedItemProps {
  item: Post;
  isReply?: boolean;
  highlighted?: boolean;
  disableClick?: boolean;
  onInteraction?: (score: number | undefined) => void;
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
    const [isJiggling, setIsJiggling] = useState(false);

    const {
      uid,
      localMetrics,
      currentScore,
      handleScoreChange, // ensure this hook function supports 'number | undefined'
      isEditing,
      setIsEditing,
      editContent,
      setEditContent,
      isSaving,
      saveEdit,
      handleCancel,
      triggerDelete,
    } = usePostActions(item);

    const isOwner = uid === item.userId;
    const charsLeft = 600 - editContent.length;
    const isNearLimit = charsLeft < 50;

    const replyScore = item.interactionScore ?? 0;
    const scoreColor = getInterpolatedColor(replyScore, DEFAULT_STOPS);

    const formattedTime = timeAgo(
      new Date(typeof item.timestamp === "number" ? item.timestamp : 0),
    );
    const formattedEditTime = item.editedAt
      ? timeAgo(new Date(item.editedAt))
      : null;

    const triggerJiggle = () => {
      setIsJiggling(false);
      window.requestAnimationFrame(() => setIsJiggling(true));
      setTimeout(() => setIsJiggling(false), 500);
    };

    /** handles both new scores and deletion (eraser) */
    const onSliderChange = (val: number | undefined) => {
      const isFirstInteraction =
        currentScore === undefined && val !== undefined;

      // Fix: cast if the hook is strictly typed, or update the hook to handle undefined
      handleScoreChange(val as any);

      if (onInteraction) onInteraction(val);
      if (isFirstInteraction) triggerJiggle();
    };

    const handleAction = (e: React.MouseEvent, action: () => void) => {
      e.stopPropagation();
      action();
    };

    return (
      <div
        className={`flex flex-col gap-4 p-4 bg-white border transition-all duration-200 rounded-lg ${
          highlighted
            ? "border-logo-blue ring-2 ring-logo-blue/10 shadow-md scale-[1.01]"
            : "border-border-subtle shadow-sm"
        }`}
      >
        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 shrink-0 border border-slate-200/50">
              <i className="bi bi-person-fill"></i>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 leading-tight">
                  {isOwner ? "You" : item.userId.substring(0, 10) + "..."}
                </span>

                {isReply && item.interactionScore !== undefined && (
                  <span
                    className="text-[10px] font-black px-1.5 py-0.5 rounded-sm border bg-white shadow-xs"
                    style={{ borderColor: scoreColor, color: scoreColor }}
                  >
                    {replyScore > 0 ? `+${replyScore}` : replyScore}
                  </span>
                )}
              </div>

              <div className="flex items-center flex-wrap gap-1 text-[10px] text-slate-400 font-medium tracking-tight">
                <span>{formattedTime}</span>
                {formattedEditTime && (
                  <span className="flex items-center italic text-slate-300">
                    <span className="mx-1">·</span> edited {formattedEditTime}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isOwner ? (
              <button
                onClick={(e) => handleAction(e, () => setIsEditing(true))}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-logo-blue hover:bg-slate-50 transition-colors"
              >
                <i className="bi bi-pencil-square text-[14px]"></i>
              </button>
            ) : uid ? (
              <button
                onClick={(e) =>
                  handleAction(e, () => uid && reportPost(item.id, uid))
                }
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-logo-red hover:bg-slate-50 transition-colors"
              >
                <i className="bi bi-flag text-[15px]"></i>
              </button>
            ) : null}
          </div>
        </div>

        {/* CONTENT */}
        {isEditing ? (
          <div
            className="flex flex-col gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <textarea
                autoFocus
                className="resize-none custom-scrollbar w-full p-3 border border-border-subtle rounded-lg outline-none min-h-24 text-[15px] focus:border-logo-blue focus:ring-1 focus:ring-logo-blue/10 transition-all"
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
                  className="px-4 py-1.5 bg-logo-blue text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                  onClick={(e) => handleAction(e, saveEdit)}
                  disabled={isSaving || !editContent.trim()}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
              <button
                className="w-8 h-8 flex items-center justify-center text-slate-400 rounded-lg hover:text-(--disagree) hover:bg-red-50"
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
        <div
          className={`flex items-center justify-between pt-3 border-t border-border-subtle gap-4 ${isReply ? "border-none pt-0" : ""}`}
        >
          {!isReply && (
            <div className="flex-1" onClick={(e) => e.stopPropagation()}>
              <InteractionSlider
                value={currentScore}
                onChange={onSliderChange}
                disabled={!uid}
              />
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {!isReply && (
              <button
                onClick={(e) =>
                  handleAction(
                    e,
                    () => !disableClick && navigate(`/post/${item.id}`),
                  )
                }
                disabled={disableClick}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg origin-center active:scale-95 transition-all
                  ${isJiggling ? "animate-jiggle shadow-md ring-2 ring-logo-blue/10" : ""}
                  ${disableClick ? "text-logo-blue" : "text-slate-400 hover:bg-slate-50 hover:text-logo-blue"}`}
              >
                <i
                  className={`bi ${disableClick ? "bi-chat-fill" : "bi-chat"} text-[16px]`}
                ></i>
                {/* localMetrics.replyCount > 0 && (
                  <span className="text-[13px] font-bold">
                    {localMetrics.replyCount}
                  </span>
                ) */}
              </button>
            )}

            <button
              onClick={(e) => handleAction(e, () => sharePost(item))}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-logo-blue active:scale-95 transition-all"
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
