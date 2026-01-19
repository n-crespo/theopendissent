import { memo, useState } from "react";
import { Post } from "../types";
import { timeAgo } from "../utils";
import { useModal } from "../context/ModalContext";
import { usePostActions } from "../hooks/usePostActions";
import { ActionMenu } from "./layout/ActionMenu";

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

    const {
      uid,
      localMetrics,
      isEditing,
      setIsEditing,
      editContent,
      setEditContent,
      isSaving,
      interactionState,
      handleInteraction,
      handleEditSave,
      handleCancel,
      handleDeleteTrigger,
    } = usePostActions(post);

    const [isJiggling, setIsJiggling] = useState(false);
    const isOwner = uid === userId;

    // Enforce visual exclusivity.
    // If somehow both agreed/dissented are true, prioritize 'dissented'.
    // or just pick one so the UI doesn't break.
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
      const wasNeutral = !activeStance;

      // Calculate next state for parent callback
      let nextStance: "agreed" | "dissented" | null = type;
      if (type === activeStance) nextStance = null;

      if (onStanceChange) {
        onStanceChange(nextStance);
      }

      handleInteraction(e, type);

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
              <div className="flex items-center flex-wrap gap-1 text-[12px] text-slate-400 font-medium tracking-tight">
                <span>{formattedTime}</span>
                {formattedEditTime && (
                  <span className="flex items-center italic">
                    <span className="mx-1">·</span>
                    edited {formattedEditTime}
                  </span>
                )}
              </div>
            </div>
          </div>
          <ActionMenu
            post={post}
            isOwner={isOwner}
            currentUserId={uid}
            onEdit={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            onDelete={(e) => {
              e.stopPropagation();
              handleDeleteTrigger(e);
            }}
          />
        </div>

        {isEditing ? (
          <div className="mb-4" onClick={(e) => e.stopPropagation()}>
            <textarea
              autoFocus
              className="w-full p-3 border border-border-subtle rounded-(--radius-input) outline-none min-h-24 text-[15px]"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={isSaving}
            />
            <div className="flex gap-2 mt-3">
              <button
                className="px-4 py-1.5 bg-logo-blue text-white rounded-(--radius-button) text-sm font-semibold"
                onClick={handleEditSave}
                disabled={isSaving}
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
          </div>
        ) : (
          <p className="text-[15px] text-slate-800 leading-[1.6] mb-5 whitespace-pre-wrap">
            {postContent}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
          <div className="relative flex items-center bg-slate-50 p-0.5 rounded-full border border-slate-100">
            <div
              className={`absolute h-7 rounded-full transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) z-0
                ${activeStance === "agreed" ? "translate-x-0 bg-logo-green" : ""}
                ${activeStance === "dissented" ? "translate-x-[102%] bg-logo-red" : ""}
                ${!activeStance ? "translate-x-[51%] opacity-0 scale-50" : "opacity-100 scale-100"}
              `}
              style={{ left: "2px", width: "48%" }}
            />

            {/* agree button */}
            <button
              onClick={(e: any) => onStanceClick(e, "agreed")}
              className={`cursor-pointer relative z-10 px-3 py-1 flex items-center gap-1.5 rounded-full active:scale-95 transition-all duration-200
                ${activeStance === "agreed" ? "text-white" : "text-slate-400 hover:text-logo-green"}`}
            >
              <i
                className={`bi bi-check-lg text-[16px] transition-transform ${activeStance === "agreed" ? "scale-120" : "scale-100"}`}
              ></i>
              <span className="text-[12px] font-bold">
                {localMetrics.agreedCount}
              </span>
            </button>

            {/* dissent button */}
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
              className={`bi ${disableClick ? "bi-chat-left-text-fill" : "bi-chat-left-text"} text-[14px] mt-1`}
            ></i>
            <span className="text-[13px] font-bold">
              {localMetrics.replyCount}
            </span>
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
