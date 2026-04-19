import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FeedItem } from "../components/feed/FeedItem";
import { ProfileReplyItem } from "../components/feed/ProfileReplyItem";
import { LoadingDots } from "../components/ui/LoadingDots";
import { useAuth } from "../context/AuthContext";
import { useUserActivity } from "../hooks/useUserActivity";
import { useUserCounts } from "../hooks/useUserCounts";
import { formatCompactNumber } from "../utils";
import { TabSwitcher } from "../components/ui/TabSwicher";
import { SEO } from "../components/ui/Seo";

type FilterType = "posts" | "replies" | "interacted";

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

  const tabs = [
    { id: "posts", label: "Posts", count: formatCompactNumber(counts.posts) },
    {
      id: "replies",
      label: "Replies",
      count: formatCompactNumber(counts.replies),
    },
    {
      id: "interacted",
      label: "Interactions",
      count: formatCompactNumber(counts.interacted),
    },
  ];

  // Find the tab object that matches the current filter
  const selectedTab = tabs.find((tab) => tab.id === filter);
  const title = selectedTab ? `Your ${selectedTab.label}` : "Your";

  return (
    <div className="flex flex-col gap-3">
      <SEO title={title} description="Your Profile" />
      <div className="grid grid-cols-1 items-center w-full px-4">
        <h1 className="my-2 col-start-1 row-start-1 justify-self-center text-xl font-bold text-slate-900 tracking-tight">
          Your Profile
        </h1>
      </div>

      <TabSwitcher
        tabs={tabs}
        activeId={filter}
        onChange={(id) => handleFilterChange(id as FilterType)}
      />

      <div className="min-h-100">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 flex flex-col items-center justify-center gap-4 text-slate-300"
            >
              <LoadingDots className="scale-125" />
              <span className="text-xs font-bold tracking-wider">
                Loading {filter}...
              </span>
            </motion.div>
          ) : (
            <motion.div
              key={filter}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col gap-4"
            >
              {posts.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                  <i className="bi bi-cloud-slash text-4xl text-slate-100 mb-3 block"></i>
                  <p className="text-slate-400 font-medium italic">
                    No {filter} found.
                  </p>
                </div>
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
