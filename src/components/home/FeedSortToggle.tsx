import { motion } from "framer-motion";
import { SortOption, useFeedSort } from "../../context/FeedSortContext";

const SORT_TABS: { id: SortOption; label: string; description: string }[] = [
  {
    id: "random",
    label: "Shuffled",
    description: "No algorithm. Just a shuffle.",
  },
  { id: "newest", label: "Newest", description: "Latest first." },
];

export const FeedSortToggle = () => {
  const { sortType, setSortType } = useFeedSort();
  const activeTab = SORT_TABS.find((tab) => tab.id === sortType);

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="inline-flex shrink-0 gap-0.5 rounded-full border border-white/70 bg-linear-to-b from-white/60 to-stone-200/40 p-0.75 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_1px_3px_rgba(28,25,23,0.1)] ring-1 ring-stone-900/5 backdrop-blur-xl backdrop-saturate-150">
        {SORT_TABS.map((tab) => {
          const isActive = sortType === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setSortType(tab.id)}
              aria-pressed={isActive}
              className={`relative rounded-full px-3.5 py-1 text-sm font-semibold transition-colors ${
                isActive
                  ? "text-stone-900"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="feedSortIndicator"
                  className="absolute inset-0 rounded-full bg-white/90 shadow-[inset_0_1px_0_white,0_1px_2px_rgba(28,25,23,0.14),0_2px_6px_rgba(28,25,23,0.06)]"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                />
              )}
              <span className="relative">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <p className="text-right text-xs text-stone-500">
        {activeTab?.description}
      </p>
    </div>
  );
};
