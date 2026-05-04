/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { SEO } from "../components/ui/Seo";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useOutletContext,
  useNavigationType,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeToPost, subscribeToReplies } from "../lib/firebase";
import { FeedItem } from "../components/feed/FeedItem";
import { SubReplyThread } from "../components/feed/SubReplyThread";
import { useAuth } from "../context/AuthContext";
import { Post } from "../types";
import { FeedItemSkeleton } from "../components/ui/FeedItemSkeleton";
import { ComposeTrigger } from "../components/feed/ComposeTrigger";

let isInitialMount = true;

export const PostDetails = () => {
  const { postId } = useParams<{ postId: string }>();
  const [searchParams] = useSearchParams();
  const highlightReplyId = searchParams.get("reply");
  const highlightSubReplyId = searchParams.get("subreply");
  const navigate = useNavigate();
  const navType = useNavigationType();

  const shouldAnimateInitial = isInitialMount || navType !== "POP";

  useEffect(() => {
    isInitialMount = false;
  }, []);

  // grab the setters from Layout
  const {
    setActiveParent,
    setIsComposeOpen,
    setActiveReplyTo,
    recentlyRepliedToId,
    setRecentlyRepliedToId,
  }: any = useOutletContext();

  const [replies, setReplies] = useState<Post[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(true);
  const [livePost, setLivePost] = useState<Post | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState(true);

  const { loading: authLoading } = useAuth();
  // const uid = user?.uid;
  // const ownedPosts = useOwnedPosts();

  // set the active parent for the FAB when the post loads
  useEffect(() => {
    if (livePost) {
      setActiveParent(livePost);
    }
    // cleanup: reset parent when leaving the thread
    return () => setActiveParent(null);
  }, [livePost, setActiveParent]);

  useEffect(() => {
    if (!postId) return;
    const unsubscribe = subscribeToPost(postId, (post) => {
      if (post) setLivePost(post);
      else navigate("/", { replace: true });
      setIsLoadingPost(false);
    });
    return () => unsubscribe();
  }, [postId, navigate]);

  useEffect(() => {
    if (!postId) return;
    setIsLoadingReplies(true);

    const unsubscribe = subscribeToReplies(postId, (list) => {
      setReplies(list);
      setIsLoadingReplies(false);

      // Only scroll to the reply if it is the primary target (no sub-reply following it)
      if (highlightReplyId && !highlightSubReplyId) {
        const replyExists = list.some((r) => r.id === highlightReplyId);
        if (replyExists) {
          setTimeout(() => {
            const element = document.getElementById(
              `reply-${highlightReplyId}`,
            );
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });

              // Clean up URL after successful scroll
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
  }, [postId, highlightReplyId, highlightSubReplyId]); // Added highlightSubReplyId to dependency array

  const handleBack = () => {
    // if there is internal history, go back
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      // mark the landing page as dismissed
      sessionStorage.setItem("landingDismissed", "true");
      navigate("/", { replace: true });
    }
  };

  const postAuthor =
    livePost?.authorDisplay && livePost.authorDisplay !== "Anonymous User"
      ? livePost.authorDisplay
      : "Anonymous User";

  return (
    <div className="flex flex-col gap-y-6">
      {livePost && (
        <SEO
          title={`Post by ${postAuthor}`}
          description="Join the conversation!"
        />
      )}

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

      <main className="flex flex-col gap-y-8">
        <section>
          {isLoadingPost || authLoading ? (
            <FeedItemSkeleton />
          ) : livePost ? (
            <FeedItem item={livePost} disableClick={true} isReply={false} />
          ) : null}
        </section>

        <div className="flex items-center gap-x-4 px-2">
          <h4 className="text-sm font-semibold text-slate-400">Discussion</h4>
          <div className="h-px w-full bg-slate-100"></div>
        </div>

        <section className="flex flex-col gap-y-4">
          <ComposeTrigger placeholder="Your thoughts?" />
          <AnimatePresence mode="popLayout" initial={shouldAnimateInitial}>
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
            ) : (
              replies.map((reply) => (
                <motion.div
                  layout
                  key={reply.id}
                  id={`reply-${reply.id}`}
                  initial={shouldAnimateInitial ? { opacity: 0, y: 12 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <FeedItem
                    item={reply}
                    isReply={true}
                    highlighted={
                      highlightReplyId === reply.id && !highlightSubReplyId
                    }
                    onReply={() => {
                      setActiveReplyTo(reply);
                      setIsComposeOpen(true);
                    }}
                  />
                  <SubReplyThread
                    parentPostId={postId!}
                    parentReply={reply}
                    targetSubReplyId={
                      highlightReplyId === reply.id ? highlightSubReplyId : null
                    }
                    recentlyRepliedToId={recentlyRepliedToId}
                    setRecentlyRepliedToId={setRecentlyRepliedToId}
                    onReply={() => {
                      setActiveReplyTo(reply);
                      setIsComposeOpen(true);
                    }}
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
