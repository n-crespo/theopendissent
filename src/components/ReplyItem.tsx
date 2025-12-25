/**
 * a smaller, simplified version of PostItem for the replies list.
 * uses denormalized interaction data for stance-based color-coding.
 */
export const ReplyItem = ({ reply }: { reply: any }) => {
  const { userId, timestamp, postContent, userInteractionType } = reply;

  // determine the stance theme
  const isAgree = userInteractionType === "agreed";

  // map stances to tailwind classes
  const stanceStyles = isAgree
    ? "bg-agree-bg border-l-agree text-agree"
    : "bg-dissent-bg border-l-dissent text-dissent";

  const stanceIcon = isAgree ? "bi-check-circle-fill" : "bi-x-circle-fill";

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "...";

  return (
    <div
      className={`flex flex-col gap-1.5 p-3 mb-2.5 rounded-r-lg border-l-4 border-y border-r border-y-slate-100 border-r-slate-100 shadow-sm text-[0.95rem] ${stanceStyles}`}
    >
      <div className="flex justify-between items-center mb-0.5">
        <div className="flex items-center gap-1.5">
          <i className={`bi ${stanceIcon} text-[0.8rem]`}></i>
          <span className="font-bold text-[0.85rem] text-slate-700">
            @{userId.substring(0, 5)}...
          </span>
        </div>
        <span className="text-[0.75rem] text-gray-custom opacity-70 font-medium">
          {formattedTime}
        </span>
      </div>

      <div className="leading-[1.4] text-[#333] whitespace-pre-wrap">
        {postContent}
      </div>
    </div>
  );
};
