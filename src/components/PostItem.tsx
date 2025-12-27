import { memo } from "react";
import { Post } from "../types";
import { timeAgo } from "../utils";
import { useModal } from "../context/ModalContext";
import { usePostActions } from "../hooks/usePostActions";
import { ActionMenu } from "./ActionMenu";

interface PostItemProps {
  post: Post;
  disableClick?: boolean;
  highlighted?: boolean;
}

/**
 * Professionalized post item with geometric consistency.
 * utilizes global design tokens for borders, radius, and shadows.
 */
export const PostItem = memo(
  ({ post, disableClick }: PostItemProps) => {
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

    const formattedTime = timeAgo(
      new Date(typeof timestamp === "number" ? timestamp : 0),
    );

    const formattedEditTime = editedAt ? timeAgo(new Date(editedAt)) : null;
    const shortenedUid = userId.substring(0, 10) + "...";
    const isOwner = uid === userId;

    const handleCardClick = () => {
      if (disableClick || isEditing) return;
      openModal("postDetails", post);
    };

    return (
      <div
        className={`bg-white p-4 mb-4 border border-border-subtle transition-all duration-200
        ${disableClick || isEditing ? "cursor-default" : "cursor-pointer"}
        ${parentPostId ? "ml-4 border-l-4 border-l-slate-200 rounded-r-(--radius-modal) scale-[0.99]" : "rounded-(--radius-modal) shadow-sm"}`}
        style={{ boxShadow: !parentPostId ? "var(--shadow-modal)" : "none" }}
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* profile icon */}
            <div className="w-9 h-9 bg-slate-100 rounded-md flex items-center justify-center text-slate-500 text-lg shrink-0 border border-slate-200/50">
              <i className="bi bi-person-fill"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900 leading-tight">
                {isOwner ? "You" : shortenedUid}
              </span>
              <div className="flex items-center flex-wrap text-[12px] text-slate-400 font-medium tracking-tight">
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
          // ... existing edit mode JSX (textarea & buttons) ...
          <div className="mb-4" onClick={(e) => e.stopPropagation()}>
            <textarea
              autoFocus
              className="w-full p-3 border border-border-subtle rounded-(--radius-input) outline-none focus:ring-2 focus:ring-logo-blue/10 focus:border-logo-blue/40 transition-all resize-none min-h-24 text-[15px] text-slate-800"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") handleCancel();
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                  handleEditSave(e as any);
              }}
              disabled={isSaving}
            />
            <div className="flex gap-2 mt-3">
              <button
                className="px-4 py-1.5 bg-logo-blue text-white rounded-(--radius-button) text-sm font-semibold disabled:opacity-50 transition-colors hover:bg-logo-blue/90"
                onClick={handleEditSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
              <button
                className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-(--radius-button) text-sm font-semibold transition-colors hover:bg-slate-200"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
                disabled={isSaving}
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

        <div className="flex items-center gap-2 pt-3 border-t border-border-subtle">
          {/* ... existing interaction buttons ... */}
          <InteractionButton
            type="agreed"
            active={interactionState.agreed}
            count={localMetrics.agreedCount}
            icon="bi-check-square"
            label="Agree"
            onClick={(e: any) => handleInteraction(e, "agreed")}
          />
          <InteractionButton
            type="dissented"
            active={interactionState.dissented}
            count={localMetrics.dissentedCount}
            icon="bi-x-square"
            label="Dissent"
            onClick={(e: any) => handleInteraction(e, "dissented")}
          />
          <div className="ml-auto text-[11px] text-slate-400 font-bold tracking-wider">
            {localMetrics.replyCount || 0} Replies
          </div>
        </div>
      </div>
    );
  },
  // ... memo comparison function ...
  (p, n) =>
    p.post.id === n.post.id &&
    p.post.postContent === n.post.postContent &&
    p.post.editedAt === n.post.editedAt &&
    JSON.stringify(p.post.metrics) === JSON.stringify(n.post.metrics) &&
    JSON.stringify(p.post.userInteractions) ===
      JSON.stringify(n.post.userInteractions),
);

const InteractionButton = ({
  type,
  active,
  count,
  icon,
  label,
  onClick,
}: any) => {
  const isAgree = type === "agreed";
  return (
    <button
      className={`flex items-center gap-2 px-3 py-1.5 rounded-(--radius-button) transition-all duration-200 cursor-pointer
        ${active ? (isAgree ? "bg-agree-bg text-agree" : "bg-dissent-bg text-dissent") : "text-slate-500 hover:bg-slate-50"}`}
      onClick={onClick}
    >
      <i
        className={`bi ${icon} text-[15px] ${active ? "opacity-100" : "opacity-70"}`}
      ></i>
      <span className="font-bold text-[13px]">{count}</span>
      <span className="text-[13px] font-semibold hidden sm:inline">
        {label}
      </span>
    </button>
  );
};

export default PostItem;
