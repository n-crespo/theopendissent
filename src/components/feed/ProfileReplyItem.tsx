import { FeedItem } from "./FeedItem"; // Use the unified component
import { Post } from "../../types";
import { useModal } from "../../context/ModalContext";

type ReplyWithParent = Post & { parentPost?: Post };

export const ProfileReplyItem = ({ reply }: { reply: ReplyWithParent }) => {
  const { openModal } = useModal();

  const handleOpenContext = () => {
    if (reply.parentPost) {
      openModal("postPopup", {
        post: reply.parentPost,
        highlightReplyId: reply.id,
      });
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
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-tight text-slate-400 hover:text-logo-blue transition-colors text-left"
          >
            <span>Replying to:</span>
            <span className="truncate max-w-50 normal-case font-medium text-slate-500 group-hover/reply:text-logo-blue transition-colors">
              "{reply.parentPost.postContent}"
            </span>
          </button>
        ) : (
          <span className="text-[11px] font-bold uppercase tracking-tight text-slate-300 italic">
            Parent post deleted
          </span>
        )}
      </div>

      {/* Unified FeedItem */}
      <FeedItem item={reply} isReply={true} disableClick={false} />
    </div>
  );
};
