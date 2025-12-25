import { useState, useEffect, useRef, memo } from "react";
import { Post } from "../types";
import { timeAgo } from "../utils";
import { addInteraction, removeInteraction } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";

interface PostItemProps {
  post: Post;
  disableClick?: boolean;
}

export const PostItem = memo(
  ({ post, disableClick }: PostItemProps) => {
    const { userId, id, postContent, timestamp, parentPostId } = post;
    const displayContent = postContent || (post as any).content;

    const { user } = useAuth();
    const { openModal } = useModal();
    const uid = user?.uid;

    const [localMetrics, setLocalMetrics] = useState(post.metrics);
    const [localInteractions, setLocalInteractions] = useState(
      post.userInteractions,
    );

    const isOptimisticRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      if (!isOptimisticRef.current) {
        setLocalMetrics(post.metrics);
        setLocalInteractions(post.userInteractions);
      }
    }, [post.metrics, post.userInteractions]);

    const interactionState = {
      agreed: !!(uid && localInteractions?.agreed?.[uid]),
      dissented: !!(uid && localInteractions?.dissented?.[uid]),
    };

    const handleCardClick = () => {
      if (disableClick) return;
      openModal("postDetails", post);
    };

    const handleInteraction = async (
      e: React.MouseEvent,
      type: "agreed" | "dissented",
    ) => {
      e.stopPropagation();
      if (!uid) {
        openModal("signin");
        return;
      }

      if (isOptimisticRef.current) clearTimeout(isOptimisticRef.current);
      isOptimisticRef.current = setTimeout(() => {
        isOptimisticRef.current = null;
      }, 2000);

      const wasActive = interactionState[type];
      const nextMetrics = { ...localMetrics };
      const nextInteractions = JSON.parse(JSON.stringify(localInteractions));

      if (wasActive) {
        nextMetrics[`${type}Count` as keyof typeof nextMetrics]--;
        if (nextInteractions[type]) delete nextInteractions[type][uid];
      } else {
        nextMetrics[`${type}Count` as keyof typeof nextMetrics]++;
        if (!nextInteractions[type]) nextInteractions[type] = {};
        nextInteractions[type][uid] = true;

        const other = type === "agreed" ? "dissented" : "agreed";
        if (interactionState[other]) {
          nextMetrics[`${other}Count` as keyof typeof nextMetrics]--;
          if (nextInteractions[other]) delete nextInteractions[other][uid];
        }
      }

      setLocalMetrics(nextMetrics);
      setLocalInteractions(nextInteractions);

      try {
        if (wasActive) {
          await removeInteraction(id, uid, type);
        } else {
          await addInteraction(id, uid, type);
          const other = type === "agreed" ? "dissented" : "agreed";
          if (interactionState[other]) await removeInteraction(id, uid, other);
        }
      } catch (err) {
        setLocalMetrics(post.metrics);
        setLocalInteractions(post.userInteractions);
      }
    };

    const formattedTime = timeAgo(
      new Date(typeof timestamp === "number" ? timestamp : 0),
    );
    const shortenedUid = userId.substring(0, 10) + "...";

    return (
      <div
        className={`bg-white rounded-xl p-4 mb-5 border border-slate-100 shadow-sm transition-transform duration-200 
          ${disableClick ? "cursor-default" : "cursor-pointer hover:shadow-md hover:-translate-y-0.5"}
          ${parentPostId ? "ml-5 border-l-4 border-l-slate-200 rounded-l-none" : ""}`}
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-xl flex-shrink-0">
            <i className="bi bi-person-fill"></i>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-blue">
              {uid === userId ? "You" : shortenedUid}
            </span>
            <span className="text-sm text-gray-custom opacity-70">
              {formattedTime}
            </span>
          </div>
        </div>

        <p className="text-slate-800 leading-relaxed mb-4 whitespace-pre-wrap">
          {displayContent}
        </p>

        <div className="flex items-center gap-5 pt-2 border-t border-slate-50">
          <InteractionButton
            type="agreed"
            active={interactionState.agreed}
            count={localMetrics.agreedCount}
            icon="bi-check-square"
            label="Agree"
            onClick={(e: any) => handleInteraction(e, "agreed")}
          />
          <InteractionButton
            type="dissented"
            active={interactionState.dissented}
            count={localMetrics.dissentedCount}
            icon="bi-chat-left-text"
            label="Dissent"
            onClick={(e: any) => handleInteraction(e, "dissented")}
          />
          <div className="ml-auto text-xs text-slate-400 font-medium uppercase tracking-widest">
            {localMetrics.replyCount || 0} Replies
          </div>
        </div>
      </div>
    );
  },
  (p, n) =>
    p.post.id === n.post.id &&
    p.post.postContent === n.post.postContent &&
    JSON.stringify(p.post.metrics) === JSON.stringify(n.post.metrics) &&
    JSON.stringify(p.post.userInteractions) ===
      JSON.stringify(n.post.userInteractions),
);

const InteractionButton = ({
  type,
  active,
  count,
  icon,
  label,
  onClick,
}: any) => {
  const isAgree = type === "agreed";

  return (
    <button
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer
        ${
          active
            ? isAgree
              ? "bg-agree-bg text-agree"
              : "bg-dissent-bg text-dissent"
            : "text-slate-500 hover:bg-slate-50"
        }`}
      onClick={onClick}
    >
      <i className={`bi ${icon} ${active ? "opacity-100" : "opacity-60"}`}></i>
      <span className="font-bold text-sm">{count}</span>
      <span className="text-xs font-medium uppercase tracking-tight">
        {label}
      </span>
    </button>
  );
};

export default PostItem; // default export to fix diagnostic error
