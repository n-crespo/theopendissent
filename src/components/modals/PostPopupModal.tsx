import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeToPost, subscribeToReplies } from "../../lib/firebase";
import { FeedItem } from "../feed/FeedItem";
import { PostInput } from "../feed/PostInput";
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

  // determine initial stance from store or post data
  const getStoreStance = () => {
    if (!uid) return null;
    const storeData = interactionStore.get(initialPost.id);
    if (storeData.agreed[uid]) return "agreed";
    if (storeData.dissented[uid]) return "dissented";

    const interactions = initialPost.userInteractions || {
      agreed: {},
      dissented: {},
    };
    if (interactions.agreed?.[uid]) return "agreed";
    if (interactions.dissented?.[uid]) return "dissented";
    return null;
  };

  const [localStance, setLocalStance] = useState<"agreed" | "dissented" | null>(
    getStoreStance,
  );

  // sync post updates
  useEffect(() => {
    const unsubscribe = subscribeToPost(initialPost.id, (post) => {
      if (post) setLivePost(post);
      else closeAllModals();
    });
    return () => unsubscribe();
  }, [initialPost.id, closeAllModals]);

  // sync replies and handle deep-link scrolling
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
      {/* 1. Main Post Focus */}
      <FeedItem
        item={livePost}
        disableClick={true}
        onStanceChange={setLocalStance}
        isReply={false}
      />

      <div className="mb-6">
        <PostInput parentPostId={livePost.id} currentStance={localStance} />
      </div>

      <div className="pr-1">
        <div className="mb-6 flex items-center justify-between">
          <h4 className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
            Discussion
          </h4>
          <div className="ml-4 h-px grow bg-border-subtle opacity-50"></div>
        </div>

        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {isLoadingReplies ? (
              <motion.div
                key="skeletons"
                className="flex flex-col gap-4"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Simplified Skeletons */}
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-slate-100"></div>
                      <div className="h-3 w-24 rounded-full bg-slate-100"></div>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-50"></div>
                  </div>
                ))}
              </motion.div>
            ) : replies.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-(--radius-input) border border-dashed border-border-subtle bg-slate-50/50 py-16 text-center"
              >
                <p className="text-sm font-medium italic text-slate-400">
                  No perspectives shared yet.
                </p>
              </motion.div>
            ) : (
              replies.map((reply) => (
                <motion.div
                  layout
                  key={reply.id}
                  id={`reply-${reply.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <FeedItem
                    item={reply}
                    isReply={true}
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
