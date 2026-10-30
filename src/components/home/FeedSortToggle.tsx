import { SortOption, useFeedSort } from "../../context/FeedSortContext";
import { GlassToggle } from "../ui/GlassToggle";

const SORT_TABS: { id: SortOption; label: string }[] = [
  { id: "random", label: "Shuffled" },
  { id: "newest", label: "Newest" },
];

const SORT_DESCRIPTIONS: Record<SortOption, string> = {
  random: "No algorithm. Just a shuffle.",
  newest: "Latest first.",
};

export const FeedSortToggle = () => {
  const { sortType, setSortType } = useFeedSort();

  return (
    <GlassToggle
      tabs={SORT_TABS}
      activeId={sortType}
      onChange={setSortType}
      description={SORT_DESCRIPTIONS[sortType]}
    />
  );
};
