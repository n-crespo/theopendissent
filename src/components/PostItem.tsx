// src/components/PostItem.tsx
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
  const { metrics, userInteractions, userId, id, content, timestamp } = post;
  const uid = currentUser?.uid;

  const interactions: UserInteractions = {
    hasAgreed: !!(uid && userInteractions?.agreed?.[uid]),
    hasInterested: !!(uid && userInteractions?.interested?.[uid]),
    hasDisagreed: !!(uid && userInteractions?.disagreed?.[uid]),
  };

  // this is the only version of handleInteraction you need
  const handleInteraction = async (
    type: "agreed" | "disagreed" | "interested",
  ) => {
    if (!uid) {
      onRequireAuth();
      return;
    }

    const interactionMap = {
      agreed: interactions.hasAgreed,
      interested: interactions.hasInterested,
      disagreed: interactions.hasDisagreed,
    };

    const currentlyActive = interactionMap[type];

    if (currentlyActive) {
      await toggleInteraction(id, uid, type, true);
    } else {
      // 1. add the new interaction
      await toggleInteraction(id, uid, type, false);

      // 2. remove any other active interactions
      const otherTypes = (
        ["agreed", "disagreed", "interested"] as const
      ).filter((t) => t !== type);

      for (const other of otherTypes) {
        if (interactionMap[other]) {
          await toggleInteraction(id, uid, other, true);
        }
      }
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
          active={interactions.hasAgreed}
          count={metrics.agreedCount}
          icon="bi-check-square"
          onClick={() => handleInteraction("agreed")}
        />
        <InteractionButton
          type="interested"
          active={interactions.hasInterested}
          count={metrics.interestedCount}
          icon="bi-fire"
          onClick={() => handleInteraction("interested")}
        />
        <InteractionButton
          type="disagreed"
          active={interactions.hasDisagreed}
          count={metrics.disagreedCount}
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
