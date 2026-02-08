import { useNavigate } from "react-router-dom";
import { FeedItem } from "./FeedItem";
import { Post } from "../../types";

type ReplyWithParent = Post & { parentPost?: Post };

export const ProfileReplyItem = ({ reply }: { reply: ReplyWithParent }) => {
  const navigate = useNavigate();

  const handleOpenContext = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent triggering parent clicks if any
    if (reply.parentPost) {
      // Navigate to the parent post and highlight this specific reply
      navigate(`/post/${reply.parentPost.id}?reply=${reply.id}`);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 group/reply">
      {/* Context Header */}
      <div className="flex items-center gap-2 pl-4 mb-0.5">
        <i className="bi bi-arrow-return-right text-slate-300 text-[10px]"></i>
        {reply.parentPost ? (
          <button
            onClick={handleOpenContext}
            className="flex items-center gap-1.5 text-[11px] font-semibold tracking-tight text-slate-400 hover:text-logo-blue transition-colors text-left"
          >
            <span>Replying to:</span>
            <span className="truncate max-w-50 normal-case font-medium text-slate-500 group-hover/reply:text-logo-blue transition-colors">
              "{reply.parentPost.postContent}"
            </span>
          </button>
        ) : (
          <span className="text-[11px] font-semibold tracking-tight text-slate-300 italic">
            Parent post deleted
          </span>
        )}
      </div>

      {/* Unified FeedItem */}
      <FeedItem item={reply} isReply={true} disableClick={false} />
    </div>
  );
};
