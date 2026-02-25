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
  const isOwner = uid === livePost?.userId;

  // store local score (number)
  const [localScore, setLocalScore] = useState<number | undefined>(undefined);

  // Helper to calculate score from Store (optimistic) or Post (server)
  const getCalculatedScore = (
    post: Post,
    userId: string | undefined,
  ): number | undefined => {
    if (!userId) return undefined;

    // check optimistic store
    const storeData = interactionStore.get(post.id);
    if (storeData[userId] !== undefined) {
      return storeData[userId];
    }

    // check server data (which is now just a flat map { uid: score })
    if (post.userInteractions && post.userInteractions[userId] !== undefined) {
      return post.userInteractions[userId];
    }

    return undefined;
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
      setLocalScore((prev) => {
        // If we already have a local score (e.g. from interaction), keep it to avoid jitter
        // Actually, for PostDetails parent -> input communication, we want the LATEST truth
        // But getCalculatedScore handles the store lookup, so it is safe.
        return getCalculatedScore(livePost, uid);
      });
    }
  }, [livePost, uid]);

  // Handler for FeedItem to update the local state when user slides
  const handleInteractionChange = (newScore: number | undefined) => {
    setLocalScore(newScore);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <ScrollableRail>
          <Chip
            onClick={() => navigate(-1)}
            icon={<i className="bi bi-arrow-left"></i>}
          >
            Back
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
          onInteraction={handleInteractionChange}
          isReply={false}
        />
      ) : null}
      {/* Post Input: Real Input OR Skeleton */}
      {/* This input is "locked" until localScore is defined */}
      {isLoadingPost || !livePost ? (
        <div className="h-15 w-full rounded-xl border border-slate-100 bg-white animate-pulse p-4 shadow-sm"></div>
      ) : isOwner ? (
        <></>
      ) : (
        <PostInput parentPostId={livePost.id} currentScore={localScore} />
      )}
      {/* Replies Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
            Replies
          </h4>
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
                  <FeedItemSkeleton key={i} />
                ))}
              </motion.div>
            ) : replies.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl py-16 text-center"
              >
                <p className="text-sm font-medium italic text-slate-400">
                  No replies yet, you can be the first!
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
