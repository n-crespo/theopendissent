import { useEffect, useState } from "react";
import { subscribeToPost, subscribeToReplies } from "../lib/firebase";
import { PostItem } from "./PostItem";
import { PostInput } from "./PostInput";
import { ReplyItem } from "./ReplyItem";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { Post } from "../types";

export const PostDetailsView = ({
  post: initialPost,
  highlightReplyId,
}: {
  post: Post;
  highlightReplyId?: string | null;
}) => {
  const [replies, setReplies] = useState<Post[]>([]);
  const [livePost, setLivePost] = useState<Post>(initialPost);

  // Local optimistic stance state
  const { user } = useAuth();
  const uid = user?.uid;

  // Initialize stance from props/server data
  const getInitialStance = () => {
    if (!uid || !initialPost.userInteractions) return null;
    if (initialPost.userInteractions.agreed?.[uid]) return "agreed";
    if (initialPost.userInteractions.dissented?.[uid]) return "dissented";
    return null;
  };

  const [localStance, setLocalStance] = useState<"agreed" | "dissented" | null>(
    getInitialStance,
  );

  const { closeAllModals } = useModal();

  // Sync local stance if server data changes (and we aren't mid-interaction)
  useEffect(() => {
    if (!livePost || !uid) return;
    const serverStance = livePost.userInteractions?.agreed?.[uid]
      ? "agreed"
      : livePost.userInteractions?.dissented?.[uid]
        ? "dissented"
        : null;

    // Only update if we don't have a local override or if we want to ensure sync
    // For now, we trust the server eventually catches up, but we can sync here
    setLocalStance(serverStance);
  }, [livePost, uid]);

  // listen for live post updates
  useEffect(() => {
    const unsubscribe = subscribeToPost(initialPost.id, (post) => {
      if (post) {
        setLivePost(post);
      } else {
        closeAllModals();
      }
    });
    return () => unsubscribe();
  }, [initialPost.id, closeAllModals]);

  // listen for replies and handle auto-scroll
  useEffect(() => {
    const unsubscribe = subscribeToReplies(initialPost.id, (list) => {
      setReplies(list);

      // handle auto-scroll to highlighted reply
      if (highlightReplyId) {
        setTimeout(() => {
          const element = document.getElementById(`reply-${highlightReplyId}`);
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    });
    return () => unsubscribe();
  }, [initialPost.id, highlightReplyId]);

  if (!livePost) return null;

  return (
    <div className="flex flex-col">
      <PostItem
        post={livePost}
        disableClick={true}
        onStanceChange={setLocalStance}
      />

      <div className="mb-10">
        <PostInput parentPostId={livePost.id} currentStance={localStance} />
      </div>

      <div className="pr-1">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
            Discussion
          </h4>
          <div className="h-px bg-border-subtle grow ml-4 opacity-50"></div>
        </div>

        {replies.length > 0 ? (
          <div className="flex flex-col gap-4">
            {replies.map((reply) => (
              <div key={reply.id} id={`reply-${reply.id}`}>
                <ReplyItem
                  reply={reply}
                  highlighted={highlightReplyId === reply.id}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-bg-preview rounded-(--radius-input) border border-dashed border-border-subtle">
            <p className="text-sm text-slate-400 italic font-medium">
              No dissenters or supporters yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
