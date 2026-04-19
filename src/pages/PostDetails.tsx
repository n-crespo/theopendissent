/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { SEO } from "../components/ui/Seo";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeToPost, subscribeToReplies } from "../lib/firebase";
import { FeedItem } from "../components/feed/FeedItem";
import { useAuth } from "../context/AuthContext";
import { interactionStore } from "../lib/interactionStore";
import { Post } from "../types";
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

  // Optimistic score helper
  const getCalculatedScore = (
    post: Post,
    userId: string | undefined,
  ): number | undefined => {
    if (!userId) return undefined;
    const storeData = interactionStore.get(post.id);
    if (storeData[userId] !== undefined) return storeData[userId];
    if (post.userInteractions && post.userInteractions[userId] !== undefined) {
      return post.userInteractions[userId];
    }
    return undefined;
  };

  // Sync Post
  useEffect(() => {
    if (!postId) return;
    const unsubscribe = subscribeToPost(postId, (post) => {
      if (post) setLivePost(post);
      else navigate("/", { replace: true });
      setIsLoadingPost(false);
    });
    return () => unsubscribe();
  }, [postId, navigate]);

  // Sync Replies & Auto-scroll logic
  useEffect(() => {
    if (!postId) return;
    setIsLoadingReplies(true);
    const unsubscribe = subscribeToReplies(postId, (list) => {
      setReplies(list);
      setIsLoadingReplies(false);

      if (highlightReplyId) {
        const replyExists = list.some((r) => r.id === highlightReplyId);
        if (replyExists) {
          setTimeout(() => {
            const element = document.getElementById(
              `reply-${highlightReplyId}`,
            );
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
              setTimeout(() => {
                const newUrl = window.location.pathname;
                window.history.replaceState(null, "", newUrl);
              }, 1000);
            }
          }, 300);
        }
      }
    });
    return () => unsubscribe();
  }, [postId, highlightReplyId]);

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/", { replace: true });
  };

  const postAuthor =
    uid === livePost?.userId
      ? "You"
      : `@${livePost?.userId.substring(0, 10)}...`;

  return (
    <div className="flex flex-col gap-y-6">
      {livePost && (
        <SEO
          title={`Post by ${postAuthor}`}
          description="Join the conversation!"
        />
      )}

      {/* Header Bar */}
      <header className="grid grid-cols-3 items-center w-full">
        <button
          className="justify-self-start p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-900 transition-all active:scale-95"
          onClick={handleBack}
        >
          <i className="bi bi-arrow-left text-2xl"></i>
        </button>
        <h1 className="justify-self-center text-lg font-bold text-slate-900 tracking-tight">
          Post
        </h1>
      </header>

      {/* Primary Content Area */}
      <main className="flex flex-col gap-y-8">
        {/* The Parent Post */}
        <section>
          {isLoadingPost || authLoading ? (
            <FeedItemSkeleton />
          ) : livePost ? (
            <FeedItem item={livePost} disableClick={true} isReply={false} />
          ) : null}
        </section>

        {/* Separator / Reply Header */}
        <div className="flex items-center gap-x-4 px-2">
          <h4 className="text-[0.65rem] font-extrabold tracking-wider uppercase text-slate-400 whitespace-nowrap">
            Discussion
          </h4>
          <div className="h-px w-full bg-slate-100"></div>
        </div>

        {/* Replies List */}
        <section className="flex flex-col gap-y-4">
          <AnimatePresence mode="popLayout">
            {isLoadingReplies ? (
              <motion.div
                key="skeletons"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-y-4"
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
                className="py-12 text-center"
              >
                <p className="text-sm font-medium italic text-slate-400">
                  No replies yet.
                </p>
              </motion.div>
            ) : (
              replies.map((reply) => (
                <motion.div
                  layout
                  key={reply.id}
                  id={`reply-${reply.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
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
        </section>
      </main>
    </div>
  );
};
