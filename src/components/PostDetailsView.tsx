import { useEffect, useState } from "react";
import { ref, onValue, query, orderByChild } from "firebase/database";
import { db } from "../lib/firebase";
import PostItem from "./PostItem";
import { PostInput } from "./PostInput";
import { ReplyItem } from "./ReplyItem";
import { useAuth } from "../context/AuthContext";

/**
 * displays the original post, a reply field, and a list of replies.
 */
export const PostDetailsView = ({ post: initialPost }: { post: any }) => {
  const [replies, setReplies] = useState<any[]>([]);
  const [livePost, setLivePost] = useState(initialPost); // track live interactions
  const { user } = useAuth();

  const uid = user?.uid;
  let currentStance: "agreed" | "dissented" | null = null;

  if (uid && livePost.userInteractions) {
    if (livePost.userInteractions.agreed?.[uid]) currentStance = "agreed";
    else if (livePost.userInteractions.dissented?.[uid])
      currentStance = "dissented";
  }

  // listener for live post updates
  useEffect(() => {
    const postRef = ref(db, `posts/${initialPost.id}`);
    const unsubscribe = onValue(postRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLivePost({ id: initialPost.id, ...data });
      }
    });
    return () => unsubscribe();
  }, [initialPost.id]);

  // listener for replies
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
      {/* Original Post */}
      <div className="mb-4 border-b border-slate-100 pb-2">
        <PostItem post={livePost} disableClick={true} />
      </div>

      {/* Reply Input */}
      <div className="mb-6">
        <PostInput parentPostId={livePost.id} currentStance={currentStance} />
      </div>

      {/* Replies List - scrolling handled by GlobalModal */}
      <div className="pr-2">
        <h4 className="text-sm font-bold mb-4 tracking-tight uppercase text-slate-500">
          Replies
        </h4>

        {replies.length > 0 ? (
          <div className="flex flex-col gap-3">
            {replies.map((reply) => (
              <ReplyItem key={reply.id} reply={reply} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-sm text-slate-400 italic">
              No dissenters or supporters yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
