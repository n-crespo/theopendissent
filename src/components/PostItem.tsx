import { useState, useEffect, useRef, memo } from "react";
import { Post } from "../types";
import { timeAgo } from "../utils";
import { addInteraction, removeInteraction } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";

interface PostItemProps {
  post: Post;
  disableClick?: boolean; // prevent recursive modals in the detail view
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

    // clicking the card opens the detail view
    const handleCardClick = () => {
      if (disableClick) return;
      openModal("postDetails", post);
    };

    const handleInteraction = async (
      e: React.MouseEvent,
      type: "agreed" | "dissented",
    ) => {
      e.stopPropagation(); // stop the card click from firing

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
          if (interactionState[other]) {
            await removeInteraction(id, uid, other);
          }
        }
      } catch (err) {
        setLocalMetrics(post.metrics);
        setLocalInteractions(post.userInteractions);
        console.error("Interaction failed:", err);
      }
    };

    const formattedTime = timeAgo(
      new Date(typeof timestamp === "number" ? timestamp : 0),
    );
    const shortenedUid = userId.substring(0, 10) + "...";

    return (
      <div
        className={`post ${parentPostId ? "reply" : ""} ${disableClick ? "no-hover" : ""}`}
        onClick={handleCardClick}
      >
        <div className="post-header">
          <div className="post-avatar">
            <i className="bi bi-person-fill"></i>
          </div>
          <div className="post-user-info">
            <span className="username">
              {uid === userId ? "You" : shortenedUid}
            </span>
            <span className="timestamp">{formattedTime}</span>
          </div>
        </div>

        <p className="post-content">{displayContent}</p>

        <div className="post-interaction-buttons">
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
}: any) => (
  <button
    className={`post-btn ${type}-button ${active ? "active" : ""}`}
    onClick={onClick}
  >
    <div className="btn-content">
      <i className={`bi ${icon}`}></i>
      <span className="count">{count}</span>
      <span className="btn-label">{label}</span>
    </div>
  </button>
);
