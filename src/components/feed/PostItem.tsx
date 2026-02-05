import { memo, useState } from "react";
import { Post } from "../../types";
import { timeAgo } from "../../utils";
import { useModal } from "../../context/ModalContext";
import { usePostActions } from "../../hooks/usePostActions";
import { useShare } from "../../hooks/useShare";
import { useReport } from "../../hooks/useReport";

export const PostItem = memo(
  ({
    post,
    disableClick,
    onStanceChange,
  }: {
    post: Post;
    disableClick?: boolean;
    onStanceChange?: (stance: "agreed" | "dissented" | null) => void;
  }) => {
    if (!post || !post.userId) return null;
    const { userId, postContent, timestamp, parentPostId, editedAt } = post;
    const { openModal } = useModal();

    const { sharePost } = useShare();
    const { reportPost } = useReport();

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
      handleEditSave,
      handleCancel,
      handleDeleteTrigger,
    } = usePostActions(post);

    const [isJiggling, setIsJiggling] = useState(false);
    const isOwner = uid === userId;

    const MAX_CHARS = 600;
    const charsLeft = MAX_CHARS - editContent.length;
    const isNearLimit = charsLeft < 50;

    const activeStance = interactionState.dissented
      ? "dissented"
      : interactionState.agreed
        ? "agreed"
        : null;

    const formattedTime = timeAgo(
      new Date(typeof timestamp === "number" ? timestamp : 0),
    );
    const formattedEditTime = editedAt ? timeAgo(new Date(editedAt)) : null;

    const onStanceClick = (
      e: React.MouseEvent,
      type: "agreed" | "dissented",
    ) => {
      if (!uid) {
        e.stopPropagation();
        toggleInteraction(type); // This will trigger the sign-in modal
        return;
      }

      const wasNeutral = !activeStance;
      let nextStance: "agreed" | "dissented" | null = type;
      if (type === activeStance) nextStance = null;

      if (onStanceChange) {
        onStanceChange(nextStance);
      }

      e.stopPropagation();
      toggleInteraction(type);

      if (wasNeutral) {
        setIsJiggling(false);
        setTimeout(() => setIsJiggling(true), 10);
        setTimeout(() => setIsJiggling(false), 500);
      }
    };

    const handleViewDetails = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disableClick || isEditing) return;
      openModal("postPopup", post);
    };

    const handleReport = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (uid) {
        reportPost(post.id, uid);
      }
    };

    const handleShare = (e: React.MouseEvent) => {
      e.stopPropagation();
      sharePost(post);
    };

    return (
      <div
        className={`bg-white p-4 mb-4 border border-border-subtle rounded-(--radius-modal) transition-all duration-200 ${
          parentPostId
            ? "ml-4 border-l-4 border-l-slate-200 scale-[0.99]"
            : "shadow-sm"
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-md flex items-center justify-center text-slate-500 shrink-0 border border-slate-200/50">
              <i className="bi bi-person-fill"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900 leading-tight">
                {isOwner ? "You" : userId.substring(0, 10) + "..."}
              </span>
              <div className="flex items-center flex-wrap gap-1 text-[10px] text-slate-400 font-medium">
                <span>{formattedTime}</span>
                {formattedEditTime && (
                  <span className="flex items-center">
                    <span className="mx-1">·</span>
                    edited {formattedEditTime}
                  </span>
                )}
              </div>
            </div>
          </div>

          {uid && (
            <div className="flex items-center">
              {isOwner ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-logo-blue hover:bg-slate-50 transition-colors"
                  title="Edit Post"
                >
                  <i className="bi bi-pencil-square text-[14px]"></i>
                </button>
              ) : (
                <button
                  onClick={handleReport}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-logo-red hover:bg-slate-50 transition-colors"
                  title="Report Post"
                >
                  <i className="bi bi-flag text-[14px]"></i>
                </button>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="mb-4" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <textarea
                autoFocus
                maxLength={MAX_CHARS}
                className="w-full p-3 border border-border-subtle rounded-(--radius-input) outline-none min-h-24 text-[15px] focus:border-logo-blue focus:ring-1 focus:ring-logo-blue/10 transition-all mb-0"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                disabled={isSaving}
              />
              {editContent.length > 0 && (
                <span
                  className={`mb-0 absolute right-2 -bottom-5 text-[10px] font-bold uppercase tracking-tight transition-colors ${
                    isNearLimit ? "text-logo-red" : "text-slate-300"
                  }`}
                >
                  {charsLeft}
                </span>
              )}
            </div>

            {/* Updated Editing Footer */}
            <div className="flex items-center justify-between mt-5">
              <div className="flex gap-2">
                <button
                  className="px-4 py-1.5 bg-logo-blue text-white rounded-(--radius-button) text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleEditSave}
                  disabled={isSaving || editContent.trim().length === 0}
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

              {/* Trash Icon */}
              <button
                className="flex items-center justify-center w-8 h-8 text-slate-400 rounded-full transition-colors hover:text-red-400 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTrigger(e);
                }}
                title="Delete Post"
              >
                <i className="bi bi-trash3 text-[16px]"></i>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-slate-800 leading-[1.6] mb-5 whitespace-pre-wrap">
            {postContent}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
          <div className="flex items-center gap-3">
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
                onClick={(e: any) => onStanceClick(e, "agreed")}
                className={`cursor-pointer relative z-10 px-3 py-1 flex items-center gap-1.5 rounded-full active:scale-95 transition-all duration-200
                  ${activeStance === "agreed" ? "text-white" : "text-slate-400 hover:text-logo-green"}`}
              >
                <i
                  className={`bi bi-check2 text-[16px] transition-transform ${activeStance === "agreed" ? "scale-120" : "scale-100"}`}
                ></i>
                <span className="text-[12px] font-bold">
                  {localMetrics.agreedCount}
                </span>
              </button>

              <button
                onClick={(e: any) => onStanceClick(e, "dissented")}
                className={`cursor-pointer relative z-10 px-3 py-1 flex items-center gap-1.5 rounded-full active:scale-95 transition-all duration-200
                  ${activeStance === "dissented" ? "text-white" : "text-slate-400 hover:text-logo-red"}`}
              >
                <i
                  className={`bi bi-x-lg text-[14px] transition-transform ${activeStance === "dissented" ? "scale-110" : "scale-100"}`}
                ></i>
                <span className="text-[12px] font-bold">
                  {localMetrics.dissentedCount}
                </span>
              </button>
            </div>

            <button
              onClick={handleViewDetails}
              disabled={disableClick}
              className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full origin-center active:scale-95 transition-all
                ${isJiggling ? "animate-jiggle shadow-md ring-2 ring-logo-blue/10" : ""}
                ${disableClick ? "cursor-default text-logo-blue" : "text-slate-400 hover:bg-slate-50 hover:text-logo-blue"}`}
            >
              <i
                className={`bi ${disableClick ? "bi-chat-fill" : "bi-chat"} text-[14px]`}
              ></i>
              <span className="text-[13px] font-bold">
                {localMetrics.replyCount}
              </span>
            </button>
          </div>
          <button
            onClick={handleShare}
            className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full text-slate-400 hover:bg-slate-50 hover:text-logo-blue active:scale-95 transition-all"
            title="Share"
          >
            <i className="bi bi-box-arrow-up text-[14px]"></i>
          </button>
        </div>
      </div>
    );
  },
  (p, n) =>
    p.post.id === n.post.id &&
    p.post.postContent === n.post.postContent &&
    p.post.replyCount === n.post.replyCount &&
    p.post.editedAt === n.post.editedAt &&
    JSON.stringify(p.post.userInteractions) ===
      JSON.stringify(n.post.userInteractions),
);

export default PostItem;
