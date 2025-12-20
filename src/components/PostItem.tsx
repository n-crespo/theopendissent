import { useState, useEffect, useRef } from "react";
import { Post, UserInteractions } from "../types";
import { User } from "firebase/auth";
import { timeAgo } from "../utils";
import { toggleInteraction } from "../lib/firebase";

interface PostItemProps {
  post: Post;
  currentUser: User | null;
  onRequireAuth: () => void;
}

export const PostItem = ({
  post,
  currentUser,
  onRequireAuth,
}: PostItemProps) => {
  const { userId, id, content, timestamp } = post;
  const uid = currentUser?.uid;

  // optimistic state
  const [localMetrics, setLocalMetrics] = useState(post.metrics);
  const [localInteractions, setLocalInteractions] = useState(
    post.userInteractions,
  );

  // ref to prevent the "stale data flicker"
  const isOptimisticRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // sync local state with incoming props, but only if not locked
  useEffect(() => {
    if (!isOptimisticRef.current) {
      setLocalMetrics(post.metrics);
      setLocalInteractions(post.userInteractions);
    }
  }, [post.metrics, post.userInteractions]);

  const interactionState = {
    agreed: !!(uid && localInteractions?.agreed?.[uid]),
    interested: !!(uid && localInteractions?.interested?.[uid]),
    disagreed: !!(uid && localInteractions?.disagreed?.[uid]),
  };

  const handleInteraction = async (
    type: "agreed" | "disagreed" | "interested",
  ) => {
    if (!uid) {
      onRequireAuth();
      return;
    }

    // set the lock to ignore incoming props for 2 seconds
    if (isOptimisticRef.current) clearTimeout(isOptimisticRef.current);
    isOptimisticRef.current = setTimeout(() => {
      isOptimisticRef.current = null;
    }, 2000);

    const wasActive = interactionState[type];

    // apply optimistic update to UI immediately
    const nextMetrics = { ...localMetrics };
    const nextInteractions = JSON.parse(JSON.stringify(localInteractions));

    if (wasActive) {
      nextMetrics[`${type}Count` as keyof typeof nextMetrics]--;
      if (nextInteractions[type]) delete nextInteractions[type][uid];
    } else {
      nextMetrics[`${type}Count` as keyof typeof nextMetrics]++;
      if (!nextInteractions[type]) nextInteractions[type] = {};
      nextInteractions[type][uid] = true;

      // "one choice only" logic
      (
        Object.keys(interactionState) as Array<keyof typeof interactionState>
      ).forEach((other) => {
        if (other !== type && interactionState[other]) {
          nextMetrics[`${other}Count` as keyof typeof nextMetrics]--;
          if (nextInteractions[other]) delete nextInteractions[other][uid];
        }
      });
    }

    setLocalMetrics(nextMetrics);
    setLocalInteractions(nextInteractions);

    // background database update
    try {
      if (wasActive) {
        await toggleInteraction(id, uid, type, true);
      } else {
        await toggleInteraction(id, uid, type, false);
        const others = (["agreed", "disagreed", "interested"] as const).filter(
          (t) => t !== type,
        );
        for (const other of others) {
          if (interactionState[other]) {
            await toggleInteraction(id, uid, other, true);
          }
        }
      }
    } catch (err) {
      // release lock and rollback on error
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
    <div className="post">
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

      <p className="post-content">{content}</p>

      <div className="post-interaction-buttons">
        <InteractionButton
          type="agreed"
          active={interactionState.agreed}
          count={localMetrics.agreedCount}
          icon="bi-check-square"
          onClick={() => handleInteraction("agreed")}
        />
        <InteractionButton
          type="interested"
          active={interactionState.interested}
          count={localMetrics.interestedCount}
          icon="bi-fire"
          onClick={() => handleInteraction("interested")}
        />
        <InteractionButton
          type="disagreed"
          active={interactionState.disagreed}
          count={localMetrics.disagreedCount}
          icon="bi-x-square"
          onClick={() => handleInteraction("disagreed")}
        />
      </div>
    </div>
  );
};

const InteractionButton = ({ type, active, count, icon, onClick }: any) => (
  <button
    className={`post-btn ${type}-button ${active ? "active" : ""}`}
    onClick={onClick}
  >
    <div className="btn-content">
      <i className={`bi ${icon}`}></i>
      <span className="count">{count}</span>
    </div>
  </button>
);
