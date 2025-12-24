import { useEffect, useState } from "react";
import { ref, onValue, query, orderByChild } from "firebase/database";
import { db } from "../lib/firebase";
import PostItem from "./PostItem";
import { PostInput } from "./PostInput";
import { ReplyItem } from "./ReplyItem";

/**
 * displays the original post, a reply field, and a scrollable list of replies.
 */
export const PostDetailsView = ({ post }: { post: any }) => {
  const [replies, setReplies] = useState<any[]>([]);

  useEffect(() => {
    const repliesRef = ref(db, `replies/${post.id}`);
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
  }, [post.id]);

  return (
    <div className="flex flex-col max-h-[75vh]">
      {/* 1. Original Post - compact wrapper */}
      <div className="mb-4 border-b border-slate-100 pb-2">
        <PostItem post={post} disableClick={true} />
      </div>

      {/* 2. Reply Input - sticky-ish area above list */}
      <div className="mb-6">
        <PostInput parentPostId={post.id} />
      </div>

      {/* 3. Scrollable Replies Area */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
        <h4 className="text-sm font-bold text-ucla-blue mb-4 uppercase tracking-tight">
          Discussion
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
