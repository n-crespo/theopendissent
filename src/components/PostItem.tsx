import { useState, useEffect, useRef, memo } from "react";
import { Post } from "../types";
import { timeAgo } from "../utils";
import { addInteraction, removeInteraction } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";

interface PostItemProps {
  post: Post;
}

export const PostItem = memo(
  ({ post }: PostItemProps) => {
    const { userId, id, postContent, timestamp, parentPostId } = post;

    // fallback for legacy data if postContent isn't yet migrated in DB
    const displayContent = postContent || (post as any).content;

    const { user } = useAuth();
    const { openModal } = useModal();
    const uid = user?.uid;

    const [localMetrics, setLocalMetrics] = useState(post.metrics);
    const [localInteractions, setLocalInteractions] = useState(
      post.userInteractions,
    );
    const [isReplying, setIsReplying] = useState(false);

    const isOptimisticRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // sync local state with incoming props if we aren't in the middle of an optimistic update
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

    const handleInteraction = async (type: "agreed" | "dissented") => {
      if (!uid) {
        openModal("signin");
        return;
      }

      // click dissent to toggle the reply input
      if (type === "dissented") {
        setIsReplying(!isReplying);
      }

      // prevent the flicker by locking external props updates for 2 seconds
      if (isOptimisticRef.current) clearTimeout(isOptimisticRef.current);
      isOptimisticRef.current = setTimeout(() => {
        isOptimisticRef.current = null;
      }, 2000);

      const wasActive = interactionState[type];
      const nextMetrics = { ...localMetrics };
      const nextInteractions = JSON.parse(JSON.stringify(localInteractions));

      // optimistic logic
      if (wasActive) {
        nextMetrics[`${type}Count` as keyof typeof nextMetrics]--;
        if (nextInteractions[type]) delete nextInteractions[type][uid];
      } else {
        nextMetrics[`${type}Count` as keyof typeof nextMetrics]++;
        if (!nextInteractions[type]) nextInteractions[type] = {};
        nextInteractions[type][uid] = true;

        // mutual exclusivity: if you agree, you can't be dissenting (and vice versa)
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
        // rollback on failure
        if (isOptimisticRef.current) {
          clearTimeout(isOptimisticRef.current);
          isOptimisticRef.current = null;
        }
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
      <div className={`post ${parentPostId ? "reply" : ""}`}>
        <div className="post-header">
          <div className="post-avatar">
            <i className="bi bi-person-fill"></i>
          </div>
          <div className="post-user-info">
            <span className="username" title={userId}>
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
            onClick={() => handleInteraction("agreed")}
          />
          <InteractionButton
            type="dissented"
            active={interactionState.dissented}
            count={localMetrics.dissentedCount}
            icon="bi-chat-left-text"
            label="Dissent"
            onClick={() => handleInteraction("dissented")}
          />
        </div>

        {isReplying && (
          <div className="reply-container" style={{ marginTop: "15px" }}>
            {/* Phase 3: we'll place the reusable PostInput here next */}
            <div
              style={{
                padding: "10px",
                borderTop: "1px solid var(--border-fg)",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--gray)",
                  fontStyle: "italic",
                }}
              >
                Write your dissent...
              </p>
            </div>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // custom comparison to prevent unnecessary re-renders in the list
    return (
      prevProps.post.id === nextProps.post.id &&
      prevProps.post.postContent === nextProps.post.postContent &&
      JSON.stringify(prevProps.post.metrics) ===
        JSON.stringify(nextProps.post.metrics) &&
      JSON.stringify(prevProps.post.userInteractions) ===
        JSON.stringify(nextProps.post.userInteractions)
    );
  },
);

interface InteractionButtonProps {
  type: string;
  active: boolean;
  count: number;
  icon: string;
  label: string;
  onClick: () => void;
}

const InteractionButton = ({
  type,
  active,
  count,
  icon,
  label,
  onClick,
}: InteractionButtonProps) => (
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
