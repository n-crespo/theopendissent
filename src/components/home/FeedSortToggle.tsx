import { useFeedSort } from "../../context/FeedSortContext";
import { TabSwitcher } from "../ui/TabSwicher";

export const FeedSortToggle = () => {
  const { sortType, setSortType } = useFeedSort();

  const sortTabs = [
    { id: "random", label: "Home" },
    { id: "newest", label: "Newest" },
  ];

  return (
    <TabSwitcher tabs={sortTabs} activeId={sortType} onChange={setSortType} />
  );
};
