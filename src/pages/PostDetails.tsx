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

export const PostDetails = () => {
  const { postId } = useParams<{ postId: string }>();
  const [searchParams] = useSearchParams();
  const highlightReplyId = searchParams.get("reply");
  const navigate = useNavigate();

  const [replies, setReplies] = useState<Post[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(true);
  const [livePost, setLivePost] = useState<Post | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState(true);

  // 1. Get user and loading state
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid;

  const [localStance, setLocalStance] = useState<"agreed" | "dissented" | null>(
    null,
  );

  // Helper to calculate stance from Store (optimistic) or Post (server)
  const getCalculatedStance = (post: Post, userId: string | undefined) => {
    if (!userId) return null;

    // Check optimistic store first
    const storeData = interactionStore.get(post.id);
    if (storeData.agreed[userId]) return "agreed";
    if (storeData.dissented[userId]) return "dissented";

    // Fallback to server data
    const interactions = post.userInteractions || { agreed: {}, dissented: {} };
    if (interactions.agreed?.[userId]) return "agreed";
    if (interactions.dissented?.[userId]) return "dissented";

    return null;
  };

  // 2. Fetch Post (Only runs when ID changes)
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

  // 3. Sync Replies
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

  // 4. CRITICAL FIX: Calculate Stance Effect
  // This runs whenever the Post updates OR the User/Auth finishes loading.
  useEffect(() => {
    if (livePost && uid) {
      setLocalStance((prev) => {
        // If we already have a local stance (e.g. user just clicked), keep it.
        // Otherwise, calculate it from the DB/Store.
        if (prev) return prev;
        return getCalculatedStance(livePost, uid);
      });
    }
  }, [livePost, uid]);
  // ^^^ Dependency on 'uid' ensures this re-runs after auth finishes

  if (isLoadingPost || authLoading) {
    // Optional: Wait for auth before showing content
    return (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-logo-blue border-t-transparent"></div>
      </div>
    );
  }

  if (!livePost) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* back navigation header */}
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

      <FeedItem
        item={livePost}
        disableClick={true}
        onStanceChange={setLocalStance}
        isReply={false}
      />

      <PostInput parentPostId={livePost.id} currentStance={localStance} />

      <div className="flex flex-col gap-4">
        {/* ... (Replies Section remains unchanged) ... */}
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
