import { memo } from "react";
import { Post } from "../types";
import { timeAgo } from "../utils";
import { useModal } from "../context/ModalContext";
import { usePostActions } from "../hooks/usePostActions";

interface PostItemProps {
  post: Post;
  disableClick?: boolean;
}

export const PostItem = memo(
  ({ post, disableClick }: PostItemProps) => {
    const { userId, postContent, timestamp, parentPostId, editedAt } = post;
    const { openModal } = useModal();

    const {
      uid,
      localMetrics,
      isEditing,
      setIsEditing,
      editContent,
      setEditContent,
      showMenu,
      setShowMenu,
      isSaving,
      menuRef,
      interactionState,
      handleInteraction,
      handleEditSave,
      handleCancel,
    } = usePostActions(post);

    const formattedTime = timeAgo(
      new Date(typeof timestamp === "number" ? timestamp : 0),
    );

    const formattedEditTime = editedAt ? timeAgo(new Date(editedAt)) : null;
    const shortenedUid = userId.substring(0, 10) + "...";

    const handleCardClick = () => {
      if (disableClick || isEditing) return;
      openModal("postDetails", post);
    };

    return (
      <div
        className={`bg-white rounded-xl p-4 mb-5 border border-[#eef0f2] shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-transform duration-200 ease-in-out
        ${disableClick || isEditing ? "cursor-default" : "cursor-pointer hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"}
        ${parentPostId ? "ml-5 border-l-4 border-l-slate-200 rounded-l-none scale-[0.98]" : ""}`}
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#eef0f2] rounded-full flex items-center justify-center text-[#555] text-[20px] shrink-0">
              <i className="bi bi-person-fill"></i>
            </div>
            <div className="flex flex-col text-sm sm:text-base">
              <span className="font-semibold text-logo-blue leading-tight">
                {uid === userId ? "You" : shortenedUid}
              </span>
              <div className="flex items-center flex-wrap gap-1 text-[13px] text-gray-custom opacity-70">
                <span>{formattedTime}</span>
                {formattedEditTime && (
                  <span className="flex items-center italic opacity-80">
                    <span className="mx-1">·</span>
                    edited {formattedEditTime}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              className="p-1 px-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              <i className="bi bi-three-dots"></i>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-100 shadow-xl rounded-lg py-1 z-50">
                {uid === userId && (
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                  >
                    <i className="bi bi-pencil-square"></i> Edit
                  </button>
                )}
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <i className="bi bi-share"></i> Share
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <i className="bi bi-flag"></i> Report
                </button>
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="mb-4" onClick={(e) => e.stopPropagation()}>
            <textarea
              autoFocus
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-logo-blue/20 transition-all resize-none min-h-25"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") handleCancel();
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                  handleEditSave(e as any);
              }}
              disabled={isSaving}
            />
            <div className="flex gap-2 mt-2">
              <button
                className="px-4 py-1.5 bg-logo-blue text-white rounded-md text-sm font-semibold disabled:opacity-50"
                onClick={handleEditSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-md text-sm font-semibold"
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
          <p className="text-[#333] leading-[1.6] mb-4 whitespace-pre-wrap">
            {postContent}
          </p>
        )}

        <div className="flex items-center gap-5 pt-2 border-t border-[#eef0f2]">
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
            icon="bi-chat-left-text"
            label="Dissent"
            onClick={(e: any) => handleInteraction(e, "dissented")}
          />
          <div className="ml-auto text-xs text-slate-400 font-medium uppercase tracking-widest">
            {localMetrics.replyCount || 0} Replies
          </div>
        </div>
      </div>
    );
  },
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
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer text-[16px]
        ${active ? (isAgree ? "bg-agree-bg text-agree" : "bg-dissent-bg text-dissent") : "text-[#6c757d] hover:bg-slate-50"}`}
      onClick={onClick}
    >
      <i className={`bi ${icon} ${active ? "opacity-100" : "opacity-60"}`}></i>
      <span className="font-semibold text-[15px]">{count}</span>
      <span className="text-[14px] font-medium hidden sm:inline">{label}</span>
    </button>
  );
};

export default PostItem;
