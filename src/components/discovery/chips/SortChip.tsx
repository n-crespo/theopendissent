import { useFeedSort } from "../../../context/FeedSortContext";
import { DropdownMenu, MenuItem } from "../../ui/DropdownMenu";
import { Chip } from "../../ui/Chip";

export const SortChip = () => {
  const { sortType, setSortType } = useFeedSort();

  // Determine label and icon based on state
  const label = sortType === "random" ? "Default" : "Newest";
  // const iconClass = sortType === "random" ? "bi-shuffle" : "bi-clock-history";
  const iconClass = "bi-sort-down";

  return (
    <DropdownMenu
      align="left"
      width="w-40"
      trigger={
        // The Chip acts as the trigger button
        <Chip
          icon={<i className={`bi ${iconClass}`}></i>}
          className="transition-colors text-logo-green active:scale-100"
        >
          {label}{" "}
          <i className="bi bi-chevron-down ml-1 opacity-50 text-[10px]"></i>
        </Chip>
      }
    >
      <MenuItem
        label="Default"
        icon="bi-shuffle"
        onClick={() => setSortType("random")}
      />
      <MenuItem
        label="Newest First"
        icon="bi-clock-history"
        onClick={() => setSortType("newest")}
      />
    </DropdownMenu>
  );
};
