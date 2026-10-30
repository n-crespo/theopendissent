import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FeedItem } from "../components/feed/FeedItem";
import { ProfileReplyItem } from "../components/feed/ProfileReplyItem";
import { FeedItemSkeleton } from "../components/ui/FeedItemSkeleton";
import { GlassToggle } from "../components/ui/GlassToggle";
import { useAuth } from "../context/AuthContext";
import { useUserActivity } from "../hooks/useUserActivity";
import { useUserCounts } from "../hooks/useUserCounts";
import { formatCompactNumber } from "../utils";
import { SEO } from "../components/ui/Seo";

type FilterType = "posts" | "replies";

const TABS: { id: FilterType; label: string }[] = [
  { id: "posts", label: "Posts" },
  { id: "replies", label: "Replies" },
];

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

  const title = filter === "replies" ? "Your replies" : "Your posts";
  const count = filter === "replies" ? counts.replies : counts.posts;
  const noun = filter === "replies" ? "reply" : "post";
  const countLabel = `${formatCompactNumber(count)} ${
    count === 1 ? noun : filter
  }`;

  return (
    <div className="flex flex-col gap-3">
      <SEO title={title} description="Your Profile" />
      <header className="flex items-center gap-x-2">
        <Link
          to="/you"
          aria-label="Back"
          className="p-2 -ml-2 rounded-control text-stone-400 hover:text-stone-900 transition-all active:scale-95"
        >
          <i className="bi bi-arrow-left text-2xl"></i>
        </Link>
        <h1 className="text-lg font-bold text-stone-900 tracking-tight">
          {title}
        </h1>
      </header>

      <GlassToggle
        tabs={TABS}
        activeId={filter}
        onChange={handleFilterChange}
        description={countLabel}
      />

      <div className="min-h-100">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              {[1, 2, 3].map((i) => (
                <FeedItemSkeleton key={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={filter}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="flex flex-col gap-3"
            >
              {posts.length === 0 ? (
                <p className="py-16 text-center text-sm font-semibold text-stone-400">
                  No {filter} found.
                </p>
              ) : (
                posts.map((item) => (
                  <div key={item.id}>
                    {filter === "replies" ? (
                      <ProfileReplyItem reply={item} />
                    ) : (
                      <FeedItem item={item} isReply={!!item.parentPostId} />
                    )}
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
