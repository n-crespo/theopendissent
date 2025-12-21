/**
 * a smaller, simplified version of PostItem for the replies list.
 */
export const ReplyItem = ({ reply }: { reply: any }) => {
  return (
    <div className="reply-item">
      <div className="reply-header">
        <span className="reply-user">@{reply.userId.substring(0, 5)}</span>
        <span className="reply-time">
          {reply.timestamp
            ? new Date(reply.timestamp).toLocaleTimeString()
            : "..."}
        </span>
      </div>
      <div className="reply-content">{reply.postContent}</div>
      {/* interaction metrics can be added here if replies can be liked/disliked */}
    </div>
  );
};
