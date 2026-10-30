/* eslint-disable @typescript-eslint/no-explicit-any */
import { memo, useRef, useState } from "react";
import { Post } from "../../types";
import { timeAgo, getStanceLabel } from "../../utils";
import { usePostActions } from "../../hooks/usePostActions";
import { useShare } from "../../hooks/useShare";
import { useReport } from "../../hooks/useReport";
import { useNavigate } from "react-router-dom";
import { getInterpolatedColor, DEFAULT_STOPS } from "../../color-utils";
import { useOwnedPosts } from "../../context/OwnedPostsContext";
import { Badge } from "../ui/Badge";
import { useAnchoredFlash } from "../ui/AnchoredBubble";

interface FeedItemProps {
  item: Post;
  isReply?: boolean;
  highlighted?: boolean;
  disableClick?: boolean;
  /** called when the Replies button is tapped on a reply card (opens sub-reply compose) */
  onReply?: () => void;
  /** detail page only: called when the discuss button is tapped (opens reply compose) */
  onDiscuss?: () => void;
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
    onDiscuss,
  }: FeedItemProps) => {
    if (!item) return null;

    const navigate = useNavigate();
    const { sharePost } = useShare();
    const { reportPost } = useReport();
    const { flash, bubble } = useAnchoredFlash();
    const editButtonRef = useRef<HTMLButtonElement>(null);

    const {
      uid,
      canEdit,
      isEditing,
      setIsEditing,
      editContent,
      setEditContent,
      isSaving,
      editError,
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

    const handleShare = async (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      // currentTarget is cleared once the handler returns, so grab it now
      const button = e.currentTarget;
      if ((await sharePost(item)) === "copied") {
        flash(() => button, "Link copied");
      }
    };

    const handleReport = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      if (!uid) return;
      const button = e.currentTarget;
      reportPost(item.id, uid);
      flash(() => button, "Report form opened", "info");
    };

    const handleSave = async (e: React.MouseEvent) => {
      e.stopPropagation();
      // the edit button remounts once the editor closes; anchor to it lazily
      if (await saveEdit()) flash(() => editButtonRef.current, "Saved");
    };

    // Shared button styles for consistency
    const actionButtonBase =
      "flex items-center gap-x-2 h-10 px-3 rounded-control text-sm font-medium hover:bg-stone-100 active:bg-stone-200/60 transition-colors";
    const actionButtonClass = `${actionButtonBase} text-stone-500 hover:text-stone-700`;

    const [isExpanded, setIsExpanded] = useState(
      () => disableClick || expandedPostIds.has(item.id),
    );
    const isLong = item.postContent.length > CONTENT_CHAR_LIMIT;
    const displayContent =
      !isExpanded && isLong
        ? item.postContent.slice(0, CONTENT_CHAR_LIMIT).trimEnd() + "..."
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
        className={`flex flex-col bg-white border transition-all duration-200 rounded-card overflow-hidden ${
          highlighted
            ? "border-logo-blue ring-2 ring-logo-blue/10 shadow-md"
            : "border-stone-200 shadow-sm"
        }`}
      >
        <div className="p-[clamp(1rem,3vw,1.25rem)] flex flex-col gap-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-x-3">
              <div className="h-10 w-10 bg-stone-100 rounded-control flex items-center justify-center text-stone-500 shrink-0 border border-stone-200/50">
                <i className="bi bi-person-fill text-lg"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-stone-900 leading-tight flex items-center gap-x-1.5">
                  {isOwner && <Badge label="You" variant="blue" />}
                  {isThreadAuthor && <Badge label="Author" variant="green" />}
                  <span>
                    {item.authorDisplay &&
                    item.authorDisplay !== "Anonymous User"
                      ? item.authorDisplay
                      : "Anonymous User"}
                  </span>
                </span>
                <div className="flex items-center flex-wrap gap-x-1 text-2xs text-stone-400 font-medium tracking-tight">
                  <span>{formattedTime}</span>
                  {formattedEditTime && (
                    <span className="flex items-center italic text-stone-300">
                      <span className="mx-1">·</span> edited {formattedEditTime}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-x-2">
              {isOwner && canEdit ? (
                <button
                  ref={editButtonRef}
                  onClick={(e) => handleAction(e, () => setIsEditing(true))}
                  className="p-2 rounded-control text-stone-400 hover:text-logo-blue hover:bg-stone-50 transition-colors"
                  aria-label="Edit"
                >
                  <i className="bi bi-pencil-square text-base"></i>
                </button>
              ) : isOwner && !isEditing ? (
                // edit window has closed: the delete action (normally inside
                // the edit view) takes the edit button's place
                <button
                  onClick={(e) => handleAction(e, triggerDelete)}
                  className="p-2 rounded-control text-stone-400 hover:text-logo-red hover:bg-red-50 transition-colors"
                  aria-label="Delete"
                >
                  <i className="bi bi-trash3 text-base"></i>
                </button>
              ) : !isOwner && uid ? (
                <button
                  onClick={handleReport}
                  className="p-2 rounded-control text-stone-400 hover:text-logo-red hover:bg-stone-50 transition-colors"
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
                  className="resize-none w-full p-3 border border-stone-200 rounded-control outline-none min-h-[6rem] text-sm focus:border-logo-blue focus:ring-1 focus:ring-logo-blue/10 transition-all"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  disabled={isSaving}
                />
                <span
                  className={`absolute right-3 bottom-3 text-2xs font-bold uppercase ${isNearLimit ? "text-logo-red" : "text-stone-300"}`}
                >
                  {charsLeft}
                </span>
              </div>
              {editError && (
                <p className="text-xs font-medium text-logo-red">
                  {editError}
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex gap-x-2">
                  <button
                    className="px-5 py-2 bg-logo-blue text-white rounded-control text-xs font-bold disabled:opacity-50"
                    onClick={handleSave}
                    disabled={isSaving || !editContent.trim() || !canEdit}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="px-5 py-2 bg-stone-100 text-stone-600 rounded-control text-xs font-bold"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </div>
                <button
                  className="h-9 w-9 flex items-center justify-center text-stone-400 rounded-control hover:text-logo-red hover:bg-red-50 transition-colors"
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
                className={`font-serif text-stone-800 text-base leading-relaxed whitespace-pre-wrap break-words ${
                  !disableClick && !isReply
                    ? "cursor-pointer transition-colors"
                    : ""
                }`}
              >
                {displayContent}
              </p>
              {isLong && !disableClick && !isExpanded && (
                <button
                  onClick={toggleExpansion}
                  // alignment lives in justify-start (justify-end/-center to change it)
                  className="flex justify-start w-full py-0.5 text-sm font-semibold text-stone-400 cursor-pointer transition-all hover:underline"
                >
                  <span>{"Read more"}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Footer — primary action on the left, stance + share on the right */}
        <div className="flex items-center justify-between gap-x-2 px-2 py-1 border-t border-stone-100 bg-stone-50/20">
          {isReply ? (
            onReply ? (
              <button
                onClick={(e) => handleAction(e, onReply)}
                className={actionButtonClass}
              >
                <i className="bi bi-reply text-lg"></i>
                <span>Reply</span>
              </button>
            ) : (
              <span />
            )
          ) : disableClick && !onDiscuss ? (
            <span />
          ) : (
            <button
              onClick={(e) =>
                handleAction(e, () =>
                  // detail page: already in the thread, so compose a reply
                  disableClick ? onDiscuss?.() : navigate(`/post/${item.id}`),
                )
              }
              className={
                hasReply
                  ? `${actionButtonBase} group font-semibold text-logo-blue`
                  : actionButtonClass
              }
            >
              <span className="relative flex items-center">
                <i
                  className={`bi bi-chat text-base ${hasReply ? "text-stone-500" : ""}`}
                ></i>
                {hasReply && (
                  <span className="absolute top-0.5 -right-1 h-2 w-2 bg-logo-blue rounded-full ring-2 ring-white group-hover:ring-stone-100 group-active:ring-stone-200 transition-all"></span>
                )}
              </span>
              <span>
                {hasReply ? "Join the discussion" : "Start the discussion"}
              </span>
            </button>
          )}

          <div className="flex items-center gap-x-1">
            {/* stance — top-level replies only */}
            {isReply && !isSubReply && item.interactionScore !== undefined && (
              <span
                title={`Stance: ${displayScore} (${getStanceLabel(score)})`}
                aria-label={`Stance: ${displayScore} (${getStanceLabel(score)})`}
                className="flex items-center gap-x-1.5 h-10 px-2 text-sm font-medium text-stone-500 select-none cursor-default"
              >
                Stance
                <span
                  style={{ backgroundColor: stanceColor }}
                  className="min-w-9 px-2.5 py-1 rounded-control text-center text-sm font-bold text-white shadow-sm"
                >
                  {displayScore}
                </span>
              </span>
            )}

            <button
              onClick={handleShare}
              className={actionButtonClass}
            >
              <i className="bi bi-send text-base"></i>
              <span>Share</span>
            </button>
          </div>
        </div>
        {bubble}
      </div>
    );
  },
  (p, n) =>
    p.item.id === n.item.id &&
    p.item.postContent === n.item.postContent &&
    p.item.replyCount === n.item.replyCount &&
    p.item.editedAt === n.item.editedAt &&
    // pending server timestamp -> real number must reach usePostActions so
    // the edit-window timer is scheduled from the actual creation time
    p.item.timestamp === n.item.timestamp &&
    p.item.interactionScore === n.item.interactionScore &&
    p.highlighted === n.highlighted &&
    p.onReply === n.onReply &&
    p.onDiscuss === n.onDiscuss,
);
