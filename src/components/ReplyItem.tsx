import { timeAgo } from "../utils";
import { usePostActions } from "../hooks/usePostActions";
import { ActionMenu } from "./ActionMenu";
import { Post } from "../types";

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

  const {
    uid,
    isEditing,
    setIsEditing,
    editContent,
    setEditContent,
    isSaving,
    handleEditSave,
    handleCancel,
    handleDeleteTrigger,
  } = usePostActions(reply);

  const isOwner = uid === userId;
  const isAgree = userInteractionType === "agreed";

  // Subtle stance colors
  const stanceText = isAgree ? "text-logo-green" : "text-logo-red";
  const stanceIcon = isAgree ? "bi-check-square-fill" : "bi-x-square-fill";
  const stanceBg = isAgree ? "bg-logo-green-light" : "bg-logo-red-light";

  const formattedTime = timeAgo(
    new Date(typeof timestamp === "number" ? timestamp : 0),
  );
  const formattedEditTime = editedAt ? timeAgo(new Date(editedAt)) : null;

  const shortenedUid = userId.substring(0, 10) + "...";

  return (
    <div
      className={`flex flex-col p-4 bg-white border transition-all rounded-(--radius-modal)
      ${
        highlighted
          ? "border-logo-blue ring-2 ring-logo-blue/10 shadow-md scale-[1.02]"
          : "border-border-subtle shadow-sm hover:border-slate-300"
      }`}
    >
      {/* header: user info, stance, and ActionMenu */}
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
                {isAgree ? "Agreed" : "Dissented"}
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

        <ActionMenu
          post={reply}
          isOwner={isOwner}
          onEdit={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          onDelete={(e) => handleDeleteTrigger(e)}
        />
      </div>

      {/* content area */}
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
          <div className="flex gap-2 mt-2">
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
        </div>
      ) : (
        <div className="text-[14px] text-slate-800 leading-relaxed whitespace-pre-wrap wrap-break-word pl-11">
          {postContent}
        </div>
      )}
    </div>
  );
};
