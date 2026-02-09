import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeToPost, subscribeToReplies } from "../lib/firebase";
import { FeedItem } from "../components/feed/FeedItem";
import { PostInput } from "../components/feed/PostInput";
import { useAuth } from "../context/AuthContext";
import { interactionStore } from "../lib/interactionStore";
import { Post } from "../types";
import { ScrollableRail } from "../components/ui/ScrollableRail";
import { Chip } from "../components/ui/Chip";
import { FeedItemSkeleton } from "../components/ui/FeedItemSkeleton";

export const PostDetails = () => {
  const { postId } = useParams<{ postId: string }>();
  const [searchParams] = useSearchParams();
  const highlightReplyId = searchParams.get("reply");
  const navigate = useNavigate();

  const [replies, setReplies] = useState<Post[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(true);
  const [livePost, setLivePost] = useState<Post | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState(true);

  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid;

  const [localStance, setLocalStance] = useState<"agreed" | "dissented" | null>(
    null,
  );

  // Helper to calculate stance from Store (optimistic) or Post (server)
  const getCalculatedStance = (post: Post, userId: string | undefined) => {
    if (!userId) return null;

    const storeData = interactionStore.get(post.id);
    if (storeData.agreed[userId]) return "agreed";
    if (storeData.dissented[userId]) return "dissented";

    const interactions = post.userInteractions || { agreed: {}, dissented: {} };
    if (interactions.agreed?.[userId]) return "agreed";
    if (interactions.dissented?.[userId]) return "dissented";

    return null;
  };

  // Fetch Post
  useEffect(() => {
    if (!postId) return;
    const unsubscribe = subscribeToPost(postId, (post) => {
      if (post) {
        setLivePost(post);
      } else {
        navigate("/");
      }
      setIsLoadingPost(false);
    });
    return () => unsubscribe();
  }, [postId, navigate]);

  // Sync Replies
  useEffect(() => {
    if (!postId) return;
    setIsLoadingReplies(true);
    const unsubscribe = subscribeToReplies(postId, (list) => {
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
  }, [postId, highlightReplyId]);

  // Calculate Stance
  useEffect(() => {
    if (livePost && uid) {
      setLocalStance((prev) => {
        if (prev) return prev;
        return getCalculatedStance(livePost, uid);
      });
    }
  }, [livePost, uid]);

  // --- RENDER LOGIC ---

  // NOTE: We removed the blocking "isLoading" return.
  // We now render the layout immediately and use skeletons for content.

  return (
    <div className="flex flex-col gap-4">
      <div>
        <ScrollableRail>
          <Chip
            onClick={() => navigate("/")}
            icon={<i className="bi bi-arrow-left"></i>}
          >
            Back to Home
          </Chip>
        </ScrollableRail>
      </div>

      {/* Main Post: Real Item OR Skeleton */}
      {isLoadingPost || authLoading ? (
        <FeedItemSkeleton />
      ) : livePost ? (
        <FeedItem
          item={livePost}
          disableClick={true}
          onStanceChange={setLocalStance}
          isReply={false}
        />
      ) : null}

      {/* Post Input: Real Input OR Skeleton */}
      {isLoadingPost || !livePost ? (
        <div className="h-15 w-full rounded-xl border border-slate-100 bg-white animate-pulse p-4 shadow-sm"></div>
      ) : (
        <PostInput parentPostId={livePost.id} currentStance={localStance} />
      )}

      {/* Replies Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
            Replies
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
                className="rounded-(--radius-input) py-16 text-center"
              >
                <p className="text-sm font-medium italic text-slate-400">
                  No dissenters yet, you can be the first!
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
