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
  const [livePost, setLivePost] = useState<Post>(initialPost);
  const { user } = useAuth();
  const { closeAllModals } = useModal();
  const uid = user?.uid;

  // Initialize input stance from the global store (instant sync on load)
  const getStoreStance = () => {
    if (!uid) return null;
    const data = interactionStore.get(initialPost.id); // Get from store
    if (data.agreed[uid]) return "agreed";
    if (data.dissented[uid]) return "dissented";
    return null;
  };

  const [localStance, setLocalStance] = useState<"agreed" | "dissented" | null>(
    getStoreStance,
  );

  // Listen for LIVE post updates (content edits, replies, etc.)
  // Interactions are handled by the Store, but we still need this for other fields
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

  // Subscribe to replies
  useEffect(() => {
    const unsubscribe = subscribeToReplies(initialPost.id, (list) => {
      setReplies(list);

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
      {/* We pass the livePost, but the internal usePostActions hook
         will override the interactions with the Global Store data
      */}
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
