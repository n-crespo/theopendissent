import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeToPost, subscribeToReplies } from "../../lib/firebase";
import { PostItem } from "../feed/PostItem";
import { PostInput } from "../feed/PostInput";
import { ReplyItem } from "../feed/ReplyItem";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import { interactionStore } from "../../lib/interactionStore";
import { Post } from "../../types";

export const PostPopupModal = ({
  post: initialPost,
  highlightReplyId,
}: {
  post: Post;
  highlightReplyId?: string | null;
}) => {
  const [replies, setReplies] = useState<Post[]>([]);
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

  // Subscribe to Post updates
  useEffect(() => {
    const unsubscribe = subscribeToPost(initialPost.id, (post) => {
      if (post) setLivePost(post);
      else closeAllModals();
    });
    return () => unsubscribe();
  }, [initialPost.id, closeAllModals]);

  // Subscribe to Replies
  useEffect(() => {
    setIsLoadingReplies(true);
    const unsubscribe = subscribeToReplies(initialPost.id, (list) => {
      setReplies(list);
      setIsLoadingReplies(false);

      if (highlightReplyId) {
        setTimeout(() => {
          const element = document.getElementById(`reply-${highlightReplyId}`);
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      }
    });
    return () => unsubscribe();
  }, [initialPost.id, highlightReplyId]);

  if (!livePost) return null;

  return (
    <div className="flex flex-col">
      {/* PART 1: Main Post & Input */}
      <PostItem
        post={livePost}
        disableClick={true}
        onStanceChange={setLocalStance}
      />

      <div className="mb-6">
        <PostInput parentPostId={livePost.id} currentStance={localStance} />
      </div>

      <div className="pr-1">
        <div className="mb-6 flex items-center justify-between">
          <h4 className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
            Replies
          </h4>
          <div className="ml-4 h-px grow bg-border-subtle opacity-50"></div>
        </div>

        {/* REPLIES AREA
            'flex flex-col gap-4' here to handle spacing for all children
        */}
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {isLoadingReplies ? (
              <motion.div
                key="skeletons"
                // Removed the wrapper class since the parent handles gap now
                className="flex flex-col gap-4"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Skeleton 1 */}
                <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-slate-100"></div>
                    <div className="flex flex-col gap-1">
                      <div className="h-3 w-24 rounded-full bg-slate-100"></div>
                      <div className="h-2 w-16 rounded-full bg-slate-50"></div>
                    </div>
                  </div>
                  <div className="h-4 w-3/4 rounded-full bg-slate-50"></div>
                  <div className="h-4 w-1/2 rounded-full bg-slate-50"></div>
                </div>

                {/* Skeleton 2 */}
                <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-slate-100"></div>
                    <div className="flex flex-col gap-1">
                      <div className="h-3 w-20 rounded-full bg-slate-100"></div>
                      <div className="h-2 w-12 rounded-full bg-slate-50"></div>
                    </div>
                  </div>
                  <div className="h-4 w-full rounded-full bg-slate-50"></div>
                </div>
              </motion.div>
            ) : replies.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="rounded-(--radius-input) border border-dashed border-border-subtle bg-bg-preview py-16 text-center"
              >
                <p className="text-sm font-medium italic text-slate-400">
                  No replies yet, you can be the first!
                </p>
              </motion.div>
            ) : (
              // RENDER LIST ITEMS DIRECTLY
              // This allows AnimatePresence to animate new items individually
              replies.map((reply) => (
                <motion.div
                  layout
                  key={reply.id}
                  id={`reply-${reply.id}`}
                  // ANIMATION PROPS FROM POSTLISTVIEW
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                    transition: { duration: 0.2 },
                  }}
                  transition={{ duration: 0.3 }}
                  className={
                    highlightReplyId === reply.id ? "relative z-10" : ""
                  }
                >
                  <ReplyItem
                    reply={reply}
                    highlighted={highlightReplyId === reply.id}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
