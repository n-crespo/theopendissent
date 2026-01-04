import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollableRail } from "../components/ui/ScrollableRail";
import { Chip } from "../components/ui/Chip";
import { PostListView } from "../components/PostListView";
import { ProfileReplyItem } from "../components/ProfileReplyItem";
import { LoadingDots } from "../components/ui/LoadingDots";
import { useAuth } from "../context/AuthContext";
import { useUserActivity } from "../hooks/useUserActivity";
import { useUserCounts } from "../hooks/useUserCounts";
import { formatCompactNumber } from "../utils";

type FilterType = "posts" | "replies" | "agreed" | "dissented";

export const Profile = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>("posts");

  // Hook now handles auto-updates (deletes/edits) internally!
  const { posts, loading } = useUserActivity(user?.uid, filter);
  const counts = useUserCounts(user?.uid);

  return (
    <div className="mx-auto flex max-w-125 flex-col gap-3 px-2">
      <div className="py-4 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Your Profile</h1>
      </div>

      <ScrollableRail>
        <Chip
          isActive={filter === "posts"}
          onClick={() => setFilter("posts")}
          icon={<i className="bi bi-file-text"></i>}
        >
          Posts{" "}
          <span className="opacity-60 ml-0.5">
            ({formatCompactNumber(counts.posts)})
          </span>
        </Chip>
        <Chip
          isActive={filter === "replies"}
          onClick={() => setFilter("replies")}
          icon={<i className="bi bi-chat-left-text"></i>}
        >
          Replies{" "}
          <span className="opacity-60 ml-0.5">
            ({formatCompactNumber(counts.replies)})
          </span>
        </Chip>
        <Chip
          isActive={filter === "agreed"}
          onClick={() => setFilter("agreed")}
          icon={<i className="bi bi-check-circle"></i>}
        >
          Agreed{" "}
          <span className="opacity-60 ml-0.5">
            ({formatCompactNumber(counts.agreed)})
          </span>
        </Chip>
        <Chip
          isActive={filter === "dissented"}
          onClick={() => setFilter("dissented")}
          icon={<i className="bi bi-x-circle"></i>}
        >
          Dissented{" "}
          <span className="opacity-60 ml-0.5">
            ({formatCompactNumber(counts.dissented)})
          </span>
        </Chip>
      </ScrollableRail>

      {/* Content Area */}
      {/* Note: Removed 'mode="wait"' from here so the list updates flow naturally */}
      <div className="min-h-50">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-4 text-slate-400">
            <LoadingDots className="scale-150" />
            <span className="text-sm font-medium">Loading {filter}...</span>
          </div>
        ) : (
          <>
            {filter === "replies" ? (
              <div className="flex flex-col gap-4">
                {/* ADDED: AnimatePresence for Replies */}
                <AnimatePresence mode="popLayout">
                  {posts.map((reply) => (
                    <motion.div
                      layout
                      key={reply.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        scale: 0.95,
                        transition: { duration: 0.2 },
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <ProfileReplyItem reply={reply} />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {posts.length === 0 && (
                  <div className="py-12 text-center text-slate-400">
                    <i className="bi bi-chat-square-dots text-4xl mb-2 block opacity-50"></i>
                    <p>No replies yet.</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* PostListView already handles animation internally */}
                <PostListView
                  posts={posts}
                  loading={false}
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
      </div>
    </div>
  );
};
