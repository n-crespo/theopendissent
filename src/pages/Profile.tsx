import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollableRail } from "../components/ui/ScrollableRail";
import { Chip } from "../components/ui/Chip";
import { PostListView } from "../components/PostListView";
import { ProfileReplyItem } from "../components/ProfileReplyItem";
import { useAuth } from "../context/AuthContext";
import { useUserActivity } from "../hooks/useUserActivity";
import { LoadingDots } from "../components/ui/LoadingDots";

type FilterType = "posts" | "replies" | "agreed" | "dissented";

export const Profile = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>("posts");
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

      {/* Animation Wrapper
         mode="wait" ensures the old content fades out BEFORE new content fades in
      */}
      <AnimatePresence mode="wait">
        <motion.div
          key={filter} // Changing key triggers the animation
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="min-h-50" // Min-height prevents layout collapse during loading
        >
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <LoadingDots className="scale-150" />
              <span className="text-sm font-medium">Loading {filter}...</span>
            </div>
          ) : (
            <>
              {filter === "replies" ? (
                // REPLIES VIEW
                <div className="flex flex-col gap-4">
                  {posts.map((reply) => (
                    <ProfileReplyItem key={reply.id} reply={reply} />
                  ))}

                  {posts.length === 0 && (
                    <div className="py-12 text-center text-slate-400">
                      <i className="bi bi-chat-square-dots text-4xl mb-2 block opacity-50"></i>
                      <p>No replies yet.</p>
                    </div>
                  )}
                </div>
              ) : (
                // STANDARD VIEW
                <>
                  <PostListView
                    posts={posts}
                    loading={false} // Loading handled by parent now
                    hasMore={false}
                    onLoadMore={() => {}}
                  />

                  {posts.length === 0 && (
                    <div className="py-12 text-center text-slate-400">
                      <i className="bi bi-inbox text-4xl mb-2 block opacity-50"></i>
                      <p>No activity found for {filter}.</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
