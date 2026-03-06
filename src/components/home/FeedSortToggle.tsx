import { motion } from "framer-motion";
import { useFeedSort, SortOption } from "../../context/FeedSortContext";

export const FeedSortToggle = () => {
  const { sortType, setSortType } = useFeedSort();

  const handleToggle = (type: SortOption) => {
    if (sortType !== type) {
      setSortType(type);
    }
  };

  const getTabStyle = (active: boolean) => `
    relative flex-1 flex items-center justify-center py-3 text-md font-bold transition-colors
    ${active ? "text-slate-900" : "text-slate-500"}
  `;

  return (
    <div className="flex w-full">
      <button
        onClick={() => handleToggle("random")}
        className={getTabStyle(sortType === "random")}
      >
        <span className="relative z-10">Home</span>
        {sortType === "random" && (
          <motion.div
            layoutId="activeTabIndicator"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-14 bg-logo-blue rounded-full"
            transition={{ type: "spring", bounce: 0.1, duration: 0.3 }}
          />
        )}
      </button>

      <button
        onClick={() => handleToggle("newest")}
        className={getTabStyle(sortType === "newest")}
      >
        <span className="relative z-10">Newest</span>
        {sortType === "newest" && (
          <motion.div
            layoutId="activeTabIndicator"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-16 bg-logo-blue rounded-full"
            transition={{ type: "spring", bounce: 0.1, duration: 0.3 }}
          />
        )}
      </button>
    </div>
  );
};
