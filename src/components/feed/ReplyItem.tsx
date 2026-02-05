import { useState } from "react";
import { timeAgo } from "../../utils";
import { usePostActions } from "../../hooks/usePostActions";
import { useShare } from "../../hooks/useShare";
import { useReport } from "../../hooks/useReport";
import { Post } from "../../types";

/**
 * ReplyItem to match PostItem consistency.
 * Uses derived metrics and supports inline editing via usePostActions.
 */
export const ReplyItem = ({
  reply,
  highlighted,
}: {
  reply: Post;
  highlighted?: boolean;
}) => {
  const { userId, timestamp, postContent, userInteractionType, editedAt } =
    reply;

  const { sharePost } = useShare();
  const { reportPost } = useReport();

  const {
    uid,
    localMetrics,
    interactionState,
    handleInteraction,
    isEditing,
    setIsEditing,
    editContent,
    setEditContent,
    isSaving,
    handleEditSave,
    handleCancel,
    handleDeleteTrigger,
  } = usePostActions(reply);

  const [isJiggling, setIsJiggling] = useState(false);
  const isOwner = uid === userId;

  // Logic for the Author's stance on the PARENT post (Header styling)
  const isAuthorAgreed = userInteractionType === "agreed";
  const stanceText = isAuthorAgreed ? "text-logo-green" : "text-logo-red";
  const stanceIcon = isAuthorAgreed
    ? "bi-check-square-fill"
    : "bi-x-square-fill";
  const stanceBg = isAuthorAgreed ? "bg-logo-green-light" : "bg-logo-red-light";

  // Logic for the Current User's stance on THIS reply (Footer buttons)
  const activeStance = interactionState.dissented
    ? "dissented"
    : interactionState.agreed
      ? "agreed"
      : null;

  const formattedTime = timeAgo(
    new Date(typeof timestamp === "number" ? timestamp : 0),
  );
  const formattedEditTime = editedAt ? timeAgo(new Date(editedAt)) : null;

  const shortenedUid = userId.substring(0, 10) + "...";

  // Handle interaction click (Agreed/Dissented on this reply)
  const onStanceClick = (e: React.MouseEvent, type: "agreed" | "dissented") => {
    const wasNeutral = !activeStance;
    handleInteraction(e, type);

    if (wasNeutral) {
      setIsJiggling(false);
      setTimeout(() => setIsJiggling(true), 10);
      setTimeout(() => setIsJiggling(false), 500);
    }
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (uid) reportPost(reply.id, uid);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    sharePost(reply);
  };

  return (
    <div
      className={`flex flex-col p-4 bg-white border transition-all rounded-(--radius-modal)
      ${
        highlighted
          ? "border-logo-blue ring-2 ring-logo-blue/10 shadow-md scale-[1.02]"
          : "border-border-subtle shadow-sm hover:border-slate-300"
      }`}
    >
      {/* Header: User info, Author Stance, and Top-Right Actions */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-md ${stanceBg} shrink-0`}
          >
            <i className={`bi ${stanceIcon} ${stanceText} text-[14px]`}></i>
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900 leading-tight">
              {isOwner ? "You" : shortenedUid}
            </span>
            <div className="flex items-center flex-wrap gap-1 text-[12px] text-slate-400 font-medium tracking-tight">
              <span className={`${stanceText} font-semibold opacity-90`}>
                {isAuthorAgreed ? "Agreed" : "Dissented"}
              </span>
              <span>· {formattedTime}</span>
              {formattedEditTime && (
                <span className="flex items-center italic">
                  <span className="mx-1">·</span>
                  edited {formattedEditTime}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Top Right Action Logic */}
        {uid && (
          <div className="flex items-center">
            {isOwner ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-logo-blue hover:bg-slate-50 transition-colors"
                title="Edit Reply"
              >
                <i className="bi bi-pencil-square text-[14px]"></i>
              </button>
            ) : (
              <button
                onClick={handleReport}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-logo-red hover:bg-slate-50 transition-colors"
                title="Report Reply"
              >
                <i className="bi bi-flag-fill text-[14px]"></i>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      {isEditing ? (
        <div className="mb-2 pl-11" onClick={(e) => e.stopPropagation()}>
          <textarea
            autoFocus
            className="w-full p-3 border border-border-subtle rounded-(--radius-input) outline-none focus:ring-2 focus:ring-logo-blue/10 focus:border-logo-blue/40 transition-all resize-none min-h-20 text-[14px] text-slate-800"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") handleCancel();
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                handleEditSave(e as any);
            }}
            disabled={isSaving}
          />
          {/* Editing Footer */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 bg-logo-blue text-white rounded-(--radius-button) text-xs font-semibold disabled:opacity-50 transition-colors hover:bg-logo-blue/90"
                onClick={handleEditSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-(--radius-button) text-xs font-semibold transition-colors hover:bg-slate-200"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
            {/* Trash Icon */}
            <button
              className="flex items-center justify-center w-7 h-7 text-slate-400 rounded-full transition-colors hover:text-red-400 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTrigger(e);
              }}
              title="Delete Reply"
            >
              <i className="bi bi-trash3 text-[14px]"></i>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-[14px] text-slate-800 leading-relaxed whitespace-pre-wrap wrap-break-word pl-11 mb-2">
          {postContent}
        </div>
      )}

      {/* Footer: Interactions and Share (Aligned with content, so added pl-11 to match) */}
      <div className="flex items-center justify-between pt-2 mt-1 border-t border-border-subtle pl-11">
        {/* Interaction Pill */}
        <div className="relative flex items-center bg-slate-50 p-0.5 rounded-full border border-slate-100">
          <div
            className={`absolute h-6 rounded-full transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) z-0
              ${activeStance === "agreed" ? "translate-x-0 bg-logo-green" : ""}
              ${activeStance === "dissented" ? "translate-x-[102%] bg-logo-red" : ""}
              ${!activeStance ? "translate-x-[51%] opacity-0 scale-50" : "opacity-100 scale-100"}
            `}
            style={{ left: "2px", width: "48%" }}
          />

          <button
            onClick={(e: any) => onStanceClick(e, "agreed")}
            className={`cursor-pointer relative z-10 px-2.5 py-0.5 flex items-center gap-1.5 rounded-full active:scale-95 transition-all duration-200
              ${activeStance === "agreed" ? "text-white" : "text-slate-400 hover:text-logo-green"}`}
          >
            <i
              className={`bi bi-check-lg text-[14px] transition-transform ${activeStance === "agreed" ? "scale-120" : "scale-100"}`}
            ></i>
            <span className="text-[11px] font-bold">
              {localMetrics.agreedCount}
            </span>
          </button>

          <button
            onClick={(e: any) => onStanceClick(e, "dissented")}
            className={`cursor-pointer relative z-10 px-2.5 py-0.5 flex items-center gap-1.5 rounded-full active:scale-95 transition-all duration-200
              ${activeStance === "dissented" ? "text-white" : "text-slate-400 hover:text-logo-red"}`}
          >
            <i
              className={`bi bi-x-lg text-[12px] transition-transform ${activeStance === "dissented" ? "scale-110" : "scale-100"}`}
            ></i>
            <span className="text-[11px] font-bold">
              {localMetrics.dissentedCount}
            </span>
          </button>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="cursor-pointer flex items-center gap-2 px-2 py-1 rounded-full text-slate-400 hover:bg-slate-50 hover:text-logo-blue active:scale-95 transition-all"
          title="Share Reply"
        >
          <i className="bi bi-box-arrow-up text-[14px]"></i>
        </button>
      </div>
    </div>
  );
};
