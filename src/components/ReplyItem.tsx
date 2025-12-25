/**
 * a smaller, simplified version of PostItem for the replies list.
 * uses denormalized interaction data for color-coding.
 */
export const ReplyItem = ({ reply }: { reply: any }) => {
  const { userId, timestamp, postContent, userInteractionType } = reply;

  // determine the stance theme
  const isAgree = userInteractionType === "agreed";
  const stanceClass = isAgree ? "stance-agree" : "stance-dissent";
  const stanceIcon = isAgree ? "bi-check-circle-fill" : "bi-x-circle-fill";

  return (
    <div className={`reply-item ${stanceClass}`}>
      <div className="reply-header">
        <div className="reply-user-meta">
          <i className={`bi ${stanceIcon} stance-indicator`}></i>
          <span className="reply-user">@{userId.substring(0, 5)}...</span>
        </div>
        <span className="reply-time">
          {timestamp
            ? new Date(timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "..."}
        </span>
      </div>
      <div className="reply-content">{postContent}</div>
    </div>
  );
};
