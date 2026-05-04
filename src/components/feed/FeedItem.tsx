/* eslint-disable @typescript-eslint/no-explicit-any */
import { memo, useState } from "react";
import { Post } from "../../types";
import { timeAgo } from "../../utils";
import { usePostActions } from "../../hooks/usePostActions";
import { useShare } from "../../hooks/useShare";
import { useReport } from "../../hooks/useReport";
import { useNavigate } from "react-router-dom";
import { getInterpolatedColor, DEFAULT_STOPS } from "../../color-utils";
import { useOwnedPosts } from "../../context/OwnedPostsContext";
import { Badge } from "../ui/Badge";

interface FeedItemProps {
  item: Post;
  isReply?: boolean;
  highlighted?: boolean;
  disableClick?: boolean;
  /** called when the Replies button is tapped on a reply card (opens sub-reply compose) */
  onReply?: () => void;
}

const CONTENT_CHAR_LIMIT = 250;
const expandedPostIds = new Set<string>(); // module level cache per session

export const FeedItem = memo(
  ({
    item,
    isReply = false,
    highlighted = false,
    disableClick = false,
    onReply,
  }: FeedItemProps) => {
    if (!item) return null;

    const navigate = useNavigate();
    const { sharePost } = useShare();
    const { reportPost } = useReport();

    const {
      uid,
      isEditing,
      setIsEditing,
      editContent,
      setEditContent,
      isSaving,
      saveEdit,
      handleCancel,
      triggerDelete,
    } = usePostActions(item);

    const ownedPosts = useOwnedPosts();
    const isOwner = ownedPosts.has(item.id);
    const isThreadAuthor = item.isThreadAuthor ?? false;

    const charsLeft = 600 - editContent.length;
    const isNearLimit = charsLeft < 50;

    const hasReply = typeof item.replyCount === "number" && item.replyCount > 0;
    const isSubReply = !!item.parentReplyId;

    // Stance Score calculation
    const score = item.interactionScore ?? 0;
    const displayScore = score > 0 ? `+${score}` : `${score}`;
    const stanceColor = getInterpolatedColor(score, DEFAULT_STOPS);

    const formattedTime = timeAgo(
      new Date(typeof item.timestamp === "number" ? item.timestamp : 0),
    );
    const formattedEditTime = item.editedAt
      ? timeAgo(new Date(item.editedAt))
      : null;

    const handleAction = (e: React.MouseEvent, action: () => void) => {
      e.stopPropagation();
      action();
    };

    // Shared button styles for consistency
    const actionButtonClass =
      "flex items-center justify-center py-4 text-slate-400 hover:bg-slate-100 active:bg-slate-200/60 transition-all";

    const [isExpanded, setIsExpanded] = useState(
      () => disableClick || expandedPostIds.has(item.id),
    );
    const isLong = item.postContent.length > CONTENT_CHAR_LIMIT;
    const displayContent =
      !isExpanded && isLong
        ? item.postContent.slice(0, CONTENT_CHAR_LIMIT) + "..."
        : item.postContent;

    const toggleExpansion = (e: React.MouseEvent) => {
      e.stopPropagation();
      const next = !isExpanded;
      setIsExpanded(next);
      if (next) {
        expandedPostIds.add(item.id);
      } else {
        expandedPostIds.delete(item.id);
      }
    };

    const handleContentClick = (e: React.MouseEvent) => {
      if (disableClick || isEditing || isReply) return;
      e.stopPropagation();
      navigate(`/post/${item.id}`);
    };

    return (
      <div
        className={`flex flex-col bg-white border transition-all duration-200 rounded-2xl overflow-hidden ${
          highlighted
            ? "border-logo-blue ring-2 ring-logo-blue/10 shadow-md"
            : "border-slate-200 shadow-sm"
        }`}
      >
        <div className="p-[clamp(1rem,3vw,1.25rem)] flex flex-col gap-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-x-3">
              <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0 border border-slate-200/50">
                <i className="bi bi-person-fill text-lg"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900 leading-tight flex items-center gap-x-1.5">
                  {isOwner && <Badge label="You" variant="blue" />}
                  {isThreadAuthor && <Badge label="Author" variant="green" />}
                  <span>
                    {item.authorDisplay &&
                    item.authorDisplay !== "Anonymous User"
                      ? item.authorDisplay
                      : "Anonymous User"}
                  </span>
                </span>
                <div className="flex items-center flex-wrap gap-x-1 text-[0.625rem] text-slate-400 font-medium tracking-tight">
                  <span>{formattedTime}</span>
                  {formattedEditTime && (
                    <span className="flex items-center italic text-slate-300">
                      <span className="mx-1">·</span> edited {formattedEditTime}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-x-2">
              {isOwner ? (
                <button
                  onClick={(e) => handleAction(e, () => setIsEditing(true))}
                  className="p-2 rounded-lg text-slate-400 hover:text-logo-blue hover:bg-slate-50 transition-colors"
                >
                  <i className="bi bi-pencil-square text-base"></i>
                </button>
              ) : uid ? (
                <button
                  onClick={(e) =>
                    handleAction(e, () => uid && reportPost(item.id, uid))
                  }
                  className="p-2 rounded-lg text-slate-400 hover:text-logo-red hover:bg-slate-50 transition-colors"
                >
                  <i className="bi bi-flag text-base"></i>
                </button>
              ) : null}
            </div>
          </div>

          {isEditing ? (
            <div
              className="flex flex-col gap-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <textarea
                  autoFocus
                  className="resize-none w-full p-3 border border-slate-200 rounded-xl outline-none min-h-[6rem] text-sm focus:border-logo-blue focus:ring-1 focus:ring-logo-blue/10 transition-all"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  disabled={isSaving}
                />
                <span
                  className={`absolute right-3 bottom-3 text-[0.6rem] font-bold uppercase ${isNearLimit ? "text-logo-red" : "text-slate-300"}`}
                >
                  {charsLeft}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-x-2">
                  <button
                    className="px-5 py-2 bg-logo-blue text-white rounded-lg text-xs font-bold disabled:opacity-50"
                    onClick={(e) => handleAction(e, saveEdit)}
                    disabled={isSaving || !editContent.trim()}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="px-5 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </div>
                <button
                  className="h-9 w-9 flex items-center justify-center text-slate-400 rounded-lg hover:text-logo-red hover:bg-red-50 transition-colors"
                  onClick={(e) => handleAction(e, triggerDelete)}
                >
                  <i className="bi bi-trash3 text-base"></i>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-y-2">
              <p
                onClick={handleContentClick}
                className={`text-slate-800 text-[1.0625rem] leading-relaxed whitespace-pre-wrap break-words ${
                  !disableClick && !isReply
                    ? "cursor-pointer transition-colors"
                    : ""
                }`}
              >
                {displayContent}
              </p>
              {isLong && !disableClick && (
                <button
                  onClick={toggleExpansion}
                  className="flex items-center gap-x-1.5 px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors self-start -ml-4"
                >
                  <i
                    className={`bi ${isExpanded ? "bi-arrow-up" : "bi-arrow-down"} text-base leading-none`}
                  />
                  <span>{isExpanded ? "Show less" : "Read more"}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Footer — 3-col for replies (Share | Stance | Replies), 2-col for posts, full-width for sub-replies */}
        <div
          className={`border-t border-slate-100 bg-slate-50/20 ${
            !isSubReply && isReply && item.interactionScore !== undefined
              ? "grid grid-cols-3"
              : "grid grid-cols-2"
          }`}
        >
          {/* Replies */}
          {isReply ? (
            <button
              onClick={(e) => handleAction(e, () => onReply?.())}
              disabled={!onReply}
              className={`${actionButtonClass} group disabled:opacity-30`}
            >
              <div className="relative flex items-center justify-center">
                <i className="bi bi-chat text-lg"></i>
                {!isSubReply && (item.replyCount || 0) > 0 && (
                  <span className="absolute top-1 -right-1 h-2.5 w-2.5 bg-logo-blue rounded-full ring-2 ring-white group-hover:ring-slate-100 group-active:ring-slate-100 transition-all"></span>
                )}
              </div>
            </button>
          ) : (
            <button
              onClick={(e) =>
                handleAction(
                  e,
                  () => !disableClick && navigate(`/post/${item.id}`),
                )
              }
              disabled={disableClick}
              className={`${actionButtonClass} disabled:opacity-50 group`}
            >
              <div className="relative flex items-center justify-center">
                <i
                  className={`bi ${
                    disableClick
                      ? "bi-chat-fill text-transparent bg-clip-text bg-linear-to-r from-logo-red via-logo-green to-logo-blue"
                      : "bi-chat"
                  } text-lg`}
                ></i>
                {hasReply && !disableClick && (
                  <span className="absolute top-1 -right-1 h-2.5 w-2.5 bg-logo-blue rounded-full ring-2 ring-white group-hover:ring-slate-100 group-active:ring-slate-100 transition-all"></span>
                )}
              </div>
            </button>
          )}

          {/* Stance — middle column, reply cards only */}
          {isReply && item.interactionScore !== undefined && (
            <div className="flex gap-3 items-center justify-center py-3 border-r border-slate-100">
              <div className="text-sm font-semibold text-slate-400">
                Stance:
              </div>
              <div
                title={`Stance: ${displayScore}`}
                style={{ backgroundColor: stanceColor }}
                className="px-4 py-2 rounded-xl shadow-lg text-sm font-bold text-white select-none cursor-default"
              >
                {displayScore}
              </div>
            </div>
          )}

          {/* Share */}
          <button
            onClick={(e) => handleAction(e, () => sharePost(item))}
            className={`${actionButtonClass} border-l border-slate-100`}
          >
            <i className="bi bi-send text-lg"></i>
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
    p.item.interactionScore === n.item.interactionScore &&
    p.highlighted === n.highlighted &&
    p.onReply === n.onReply,
);
