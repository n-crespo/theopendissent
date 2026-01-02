import { useEffect, useState } from "react";
import { subscribeToPost, subscribeToReplies } from "../lib/firebase";
import { PostItem } from "./PostItem";
import { PostInput } from "./PostInput";
import { ReplyItem } from "./ReplyItem";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { interactionStore } from "../lib/interactionStore";
import { Post } from "../types";

export const PostDetailsView = ({
  post: initialPost,
  highlightReplyId,
}: {
  post: Post;
  highlightReplyId?: string | null;
}) => {
  const [replies, setReplies] = useState<Post[]>([]);
  // add loading state
  const [isLoadingReplies, setIsLoadingReplies] = useState(true);

  const [livePost, setLivePost] = useState<Post>(initialPost);
  const { user } = useAuth();
  const { closeAllModals } = useModal();
  const uid = user?.uid;

  const getStoreStance = () => {
    if (!uid) return null;
    const data = interactionStore.get(initialPost.id);
    if (data.agreed[uid]) return "agreed";
    if (data.dissented[uid]) return "dissented";
    return null;
  };

  const [localStance, setLocalStance] = useState<"agreed" | "dissented" | null>(
    getStoreStance,
  );

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

  useEffect(() => {
    // reset loading on id change
    setIsLoadingReplies(true);

    const unsubscribe = subscribeToReplies(initialPost.id, (list) => {
      setReplies(list);
      setIsLoadingReplies(false); // data received

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

      <div className="mb-6">
        <PostInput parentPostId={livePost.id} currentStance={localStance} />
      </div>

      <div className="pr-1">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
            Replies
          </h4>
          <div className="h-px bg-border-subtle grow ml-4 opacity-50"></div>
        </div>

        {/* loading state prevents the 'empty' flash */}
        {isLoadingReplies ? (
          <div className="flex flex-col gap-4 animate-pulse">
            {/* dummy skeletons to hold layout height */}
            <div className="h-24 bg-slate-50 rounded-xl border border-slate-100"></div>
            <div className="h-24 bg-slate-50 rounded-xl border border-slate-100"></div>
          </div>
        ) : replies.length > 0 ? (
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
              No replies yet, you can be the first!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
