import { useState } from "react";
import { ScrollableRail } from "../components/ui/ScrollableRail";
import { Chip } from "../components/ui/Chip";
import { PostListView } from "../components/PostListView";
import { useAuth } from "../context/AuthContext";
import { useUserActivity } from "../hooks/useUserActivity";

type FilterType = "posts" | "replies" | "agreed" | "dissented";

export const Profile = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>("posts");

  // The magic hook
  const { posts, loading } = useUserActivity(user?.uid, filter);

  return (
    <div className="mx-auto flex max-w-125 flex-col gap-3 px-2">
      <ScrollableRail>
        <Chip
          isActive={filter === "posts"}
          onClick={() => setFilter("posts")}
          icon={<i className="bi bi-file-text"></i>}
        >
          Posts
        </Chip>
        <Chip
          isActive={filter === "replies"}
          onClick={() => setFilter("replies")}
          icon={<i className="bi bi-chat-left-text"></i>}
        >
          Replies
        </Chip>
        <Chip
          isActive={filter === "agreed"}
          onClick={() => setFilter("agreed")}
          icon={<i className="bi bi-check-circle"></i>}
        >
          Agreed
        </Chip>
        <Chip
          isActive={filter === "dissented"}
          onClick={() => setFilter("dissented")}
          icon={<i className="bi bi-x-circle"></i>}
        >
          Dissented
        </Chip>
      </ScrollableRail>

      {/* Reusing your refactored List View */}
      {/* Note: hasMore/onLoadMore are disabled here as we fetch all history at once for now */}
      <PostListView
        posts={posts}
        loading={loading}
        hasMore={false}
        onLoadMore={() => {}}
      />

      {!loading && posts.length === 0 && (
        <div className="py-12 text-center text-slate-400">
          <i className="bi bi-inbox text-4xl mb-2 block opacity-50"></i>
          <p>No activity found for {filter}.</p>
        </div>
      )}
    </div>
  );
};
