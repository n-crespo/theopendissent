import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
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
  const [searchParams, setSearchParams] = useSearchParams();

  // default to 'posts' if url is empty.
  const filter = (searchParams.get("tab") as FilterType) || "posts";

  useEffect(() => {
    if (!user) navigate("/", { replace: true });
  }, [user, navigate]);

  const { posts, loading } = useUserActivity(user?.uid, filter);
  const counts = useUserCounts(user?.uid);

  // Helper to update URL without cluttering history (replace: true)
  const handleFilterChange = (newFilter: FilterType) => {
    setSearchParams({ tab: newFilter }, { replace: true });
  };

  if (!user) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* Header Grid */}
      <div className="grid grid-cols-1 items-center w-full">
        <div className="col-start-1 row-start-1 justify-self-start z-10">
          <ScrollableRail>
            <Chip
              onClick={() => navigate(-1)} // -1 restores previous URL (including ?tab=...)
              icon={<i className="bi bi-arrow-left"></i>}
            >
              Back
            </Chip>
          </ScrollableRail>
        </div>
        <h1 className="col-start-1 row-start-1 justify-self-center text-xl font-bold text-slate-900 tracking-tight text-nowrap">
          Your Profile
        </h1>
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
            // 5. Use the new handler
            onClick={() => handleFilterChange(tab.id as FilterType)}
            icon={<i className={`bi ${tab.icon}`}></i>}
          >
            {tab.label}{" "}
            <span className="opacity-50 ml-1">
              {formatCompactNumber(tab.count)}
            </span>
          </Chip>
        ))}
      </ScrollableRail>

      <div className="min-h-100">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-300">
            <LoadingDots className="scale-125" />
            <span className="text-xs font-bold tracking-widest">
              Loading {filter}...
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* 6. FIX: Add initial={false} to stop animation on mount (helps scroll restoration) */}
            <AnimatePresence mode="popLayout" initial={false}>
              {posts.length === 0 ? (
                <motion.div
                  key="empty"
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
