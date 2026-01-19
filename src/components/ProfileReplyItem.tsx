import { ReplyItem } from "./ReplyItem";
import { Post } from "../types";
import { useModal } from "../context/ModalContext";

// Extend Post type locally to include the injected parentPost
type ReplyWithParent = Post & { parentPost?: Post };

export const ProfileReplyItem = ({ reply }: { reply: ReplyWithParent }) => {
  const { openModal } = useModal();

  const handleOpenContext = () => {
    if (reply.parentPost) {
      // Opens the PostPopupView for the PARENT, but tells it to highlight THIS reply
      openModal("postDetails", {
        post: reply.parentPost,
        highlightReplyId: reply.id,
      });
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {/* Context Header */}
      {reply.parentPost ? (
        <div
          onClick={handleOpenContext}
          className="group flex items-center gap-2 pl-4 text-xs text-slate-400 cursor-pointer hover:text-logo-blue transition-colors mb-1"
        >
          <i className="bi bi-arrow-return-right"></i>
          <span>Replying to:</span>
          <span className="font-medium truncate max-w-50 text-slate-500 group-hover:text-logo-blue">
            {reply.parentPost.postContent}
          </span>
        </div>
      ) : (
        <div className="pl-4 text-xs text-slate-300 italic mb-1">
          Parent post deleted
        </div>
      )}

      {/* The Actual Reply - using your existing component which has no Reply buttons */}
      <ReplyItem reply={reply} />
    </div>
  );
};
