import { useState } from "react";
import { ScrollableRail } from "../components/ui/ScrollableRail";
import { Chip } from "../components/ui/Chip";
import { useAuth } from "../context/AuthContext";

type FilterType = "posts" | "replies" | "agreed" | "dissented";

export const Profile = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>("posts");

  return (
    <div className="mx-auto flex max-w-125 flex-col gap-3 px-2">
      <div className="py-4 text-center">
        <h1 className="text-2xl font-bold text-slate-800">
          Hi{" "}
          {user?.displayName
            ? user.displayName
                .split(" ")[0]
                .toLowerCase()
                .replace(/\b\w/g, (c) => c.toUpperCase())
            : "there"}
          !
        </h1>
      </div>

      {/* Filter Rail */}
      <ScrollableRail>
        <Chip
          isActive={filter === "posts"}
          onClick={() => setFilter("posts")}
          icon={<i className="bi bi-file-text"></i>}
        >
          Your Posts
        </Chip>
        <Chip
          isActive={filter === "replies"}
          onClick={() => setFilter("replies")}
          icon={<i className="bi bi-chat-left-text"></i>}
        >
          Your Replies
        </Chip>
        <Chip
          isActive={filter === "agreed"}
          onClick={() => setFilter("agreed")}
          icon={<i className="bi bi-check-circle"></i>}
        >
          Agreed Posts
        </Chip>
        <Chip
          isActive={filter === "dissented"}
          onClick={() => setFilter("dissented")}
          icon={<i className="bi bi-x-circle"></i>}
        >
          Dissented Posts
        </Chip>
      </ScrollableRail>

      {/* Placeholder for the Feed */}
      <div className="p-8 text-center text-slate-500">Showing {filter}...</div>
    </div>
  );
};
