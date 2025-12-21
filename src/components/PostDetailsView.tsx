import { useEffect, useState } from "react";
import { ref, onValue, query, orderByChild } from "firebase/database";
import { db } from "../lib/firebase";
import { PostItem } from "./PostItem";
import { PostInput } from "./PostInput";
import { ReplyItem } from "./ReplyItem";

/**
 * displays the original post, a reply field, and a scrollable list of replies.
 */
export const PostDetailsView = ({ post }: { post: any }) => {
  const [replies, setReplies] = useState<any[]>([]);

  useEffect(() => {
    // fetch replies specifically for this postId
    const repliesRef = ref(db, `replies/${post.id}`);
    const repliesQuery = query(repliesRef, orderByChild("timestamp"));

    const unsubscribe = onValue(repliesQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val,
        }));
        // newest replies at the bottom for a "chat-like" flow, or reverse() for newest first
        setReplies(list);
      } else {
        setReplies([]);
      }
    });

    return () => unsubscribe();
  }, [post.id]);

  return (
    <div className="post-details-container">
      {/* 1. Original Post - clicking it shouldn't re-open the modal */}
      <div className="original-post-wrapper">
        <PostItem post={post} disableClick={true} />
      </div>

      <div className="reply-input-section">
        <PostInput parentPostId={post.id} />
      </div>

      {/* 3. Isolated Scrollable Area */}
      <div className="replies-list">
        {replies.length > 0 ? (
          replies.map((reply) => <ReplyItem key={reply.id} reply={reply} />)
        ) : (
          <p className="empty-replies">No replies yet.</p>
        )}
      </div>
    </div>
  );
};
