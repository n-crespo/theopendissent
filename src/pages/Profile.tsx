import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollableRail } from "../components/ui/ScrollableRail";
import { Chip } from "../components/ui/Chip";
import { FeedItem } from "../components/feed/FeedItem";
import { ProfileReplyItem } from "../components/feed/ProfileReplyItem";
import { LoadingDots } from "../components/ui/LoadingDots";
import { useAuth } from "../context/AuthContext";
import { useUserActivity } from "../hooks/useUserActivity";
import { useUserCounts } from "../hooks/useUserCounts";
import { formatCompactNumber } from "../utils";

type FilterType = "posts" | "replies" | "agreed" | "dissented";

export const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("posts");

  useEffect(() => {
    if (!user) navigate("/", { replace: true });
  }, [user, navigate]);

  const { posts, loading } = useUserActivity(user?.uid, filter);
  const counts = useUserCounts(user?.uid);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="py-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Your Profile
        </h1>
        <p className="text-sm text-slate-400 font-medium">
          Manage your contributions and interactions
        </p>
      </div>

      <ScrollableRail>
        {[
          {
            id: "posts",
            label: "Posts",
            icon: "bi-file-text",
            count: counts.posts,
          },
          {
            id: "replies",
            label: "Replies",
            icon: "bi-chat-left-text",
            count: counts.replies,
          },
          {
            id: "agreed",
            label: "Agreed",
            icon: "bi-check-circle",
            count: counts.agreed,
          },
          {
            id: "dissented",
            label: "Dissented",
            icon: "bi-x-circle",
            count: counts.dissented,
          },
        ].map((tab) => (
          <Chip
            key={tab.id}
            isActive={filter === tab.id}
            onClick={() => setFilter(tab.id as FilterType)}
            icon={<i className={`bi ${tab.icon}`}></i>}
          >
            {tab.label}{" "}
            <span className="opacity-50 ml-1">
              {formatCompactNumber(tab.count)}
            </span>
          </Chip>
        ))}
      </ScrollableRail>

      <div className="min-h-100 mt-2">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-300">
            <LoadingDots className="scale-125" />
            <span className="text-xs font-bold tracking-widest">
              Loading {filter}...
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {posts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl"
                >
                  <i className="bi bi-cloud-slash text-4xl text-slate-100 mb-3 block"></i>
                  <p className="text-slate-400 font-medium italic">
                    No {filter} found.
                  </p>
                </motion.div>
              ) : (
                posts.map((item) => (
                  <motion.div
                    layout
                    key={`${filter}-${item.id}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    {filter === "replies" ? (
                      <ProfileReplyItem reply={item} />
                    ) : (
                      <FeedItem
                        item={item}
                        isReply={
                          filter === "agreed" || filter === "dissented"
                            ? !!item.parentPostId
                            : false
                        }
                      />
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
