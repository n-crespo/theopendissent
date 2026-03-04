import { createContext, useContext, useState, ReactNode } from "react";

export type SortOption = "random" | "newest";

interface FeedSortContextType {
  sortType: SortOption;
  setSortType: (type: SortOption) => void;
}

const FeedSortContext = createContext<FeedSortContextType | null>(null);

export const FeedSortProvider = ({ children }: { children: ReactNode }) => {
  // initialize from storage if it exists
  const [sortType, setSortType] = useState<SortOption>(() => {
    const saved = localStorage.getItem("feedSortSelection");
    return (saved as SortOption) || "random";
  });

  const handleSetSortType = (type: SortOption) => {
    setSortType(type);
    localStorage.setItem("feedSortSelection", type);
  };

  return (
    <FeedSortContext.Provider
      value={{ sortType, setSortType: handleSetSortType }}
    >
      {children}
    </FeedSortContext.Provider>
  );
};

export const useFeedSort = () => {
  const context = useContext(FeedSortContext);
  if (!context) {
    throw new Error("useFeedSort must be used within a FeedSortProvider");
  }
  return context;
};
