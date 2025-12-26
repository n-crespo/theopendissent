import { useEffect, useState } from "react";
import { ref, onValue, query, orderByChild } from "firebase/database";
import { db } from "../lib/firebase";
import { PostItem } from "./PostItem";
import { PostInput } from "./PostInput";
import { ReplyItem } from "./ReplyItem";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";

export const PostDetailsView = ({ post: initialPost }: { post: any }) => {
  const [replies, setReplies] = useState<any[]>([]);
  const [livePost, setLivePost] = useState(initialPost);
  const { user } = useAuth();
  const { closeAllModals } = useModal();

  const uid = user?.uid;
  let currentStance: "agreed" | "dissented" | null = null;

  if (uid && livePost?.userInteractions) {
    if (livePost.userInteractions.agreed?.[uid]) currentStance = "agreed";
    else if (livePost.userInteractions.dissented?.[uid])
      currentStance = "dissented";
  }

  useEffect(() => {
    const postRef = ref(db, `posts/${initialPost.id}`);
    const unsubscribe = onValue(postRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLivePost({ id: initialPost.id, ...data });
      } else {
        // close the view if the post is deleted by any user
        closeAllModals();
      }
    });
    return () => unsubscribe();
  }, [initialPost.id, closeAllModals]);

  useEffect(() => {
    const repliesRef = ref(db, `replies/${initialPost.id}`);
    const repliesQuery = query(repliesRef, orderByChild("timestamp"));

    const unsubscribe = onValue(repliesQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val,
        }));
        setReplies(list);
      } else {
        setReplies([]);
      }
    });

    return () => unsubscribe();
  }, [initialPost.id]);

  return (
    <div className="flex flex-col">
      <div className="mb-6 border-b border-border-subtle pb-6">
        {/* check for livePost existence to prevent child crashes */}
        {livePost && <PostItem post={livePost} disableClick={true} />}
      </div>

      <div className="mb-10">
        {livePost && (
          <PostInput parentPostId={livePost.id} currentStance={currentStance} />
        )}
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
              <ReplyItem key={reply.id} reply={reply} />
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
