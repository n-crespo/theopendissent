import { useEffect, useState } from "react";
import { ref, onValue, query, orderByChild } from "firebase/database";
import { db } from "../lib/firebase";
import { PostItem } from "./PostItem";
import { PostInput } from "./PostInput";
import { ReplyItem } from "./ReplyItem";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { Post } from "../types";

/**
 * displays the original post, a reply field, and a list of replies.
 */
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

  // calculate current user's stance on the live post
  const currentStance = (() => {
    if (!uid || !livePost?.userInteractions) return null;
    if (livePost.userInteractions.agreed?.[uid]) return "agreed";
    if (livePost.userInteractions.dissented?.[uid]) return "dissented";
    return null;
  })();

  // listen for live post updates
  useEffect(() => {
    const postRef = ref(db, `posts/${initialPost.id}`);
    const unsubscribe = onValue(postRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setLivePost({
          id: initialPost.id,
          ...data,
          // ensure userInteractions is initialized if missing in DB
          userInteractions: data.userInteractions || {
            agreed: {},
            dissented: {},
          },
        });
      } else {
        closeAllModals();
      }
    });
    return () => unsubscribe();
  }, [initialPost.id, closeAllModals]);

  // listen for replies and handle auto-scroll
  useEffect(() => {
    const repliesRef = ref(db, `replies/${initialPost.id}`);
    const repliesQuery = query(repliesRef, orderByChild("timestamp"));

    const unsubscribe = onValue(repliesQuery, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val,
          userInteractions: val.userInteractions || {
            agreed: {},
            dissented: {},
          },
        }));

        setReplies(list);

        // handle auto-scroll to highlighted reply
        if (highlightReplyId) {
          setTimeout(() => {
            const element = document.getElementById(
              `reply-${highlightReplyId}`,
            );
            element?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 100);
        }
      } else {
        setReplies([]);
      }
    });

    return () => unsubscribe();
  }, [initialPost.id, highlightReplyId]);

  if (!livePost) return null;

  return (
    <div className="flex flex-col">
      <div className="mt-4">
        <PostItem post={livePost} disableClick={true} />
      </div>

      <div className="mb-10">
        <PostInput parentPostId={livePost.id} currentStance={currentStance} />
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
