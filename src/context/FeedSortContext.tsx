import { createContext, useContext, useState, ReactNode } from "react";

export type SortOption = "random" | "newest";

interface FeedSortContextType {
  sortType: SortOption;
  setSortType: (type: SortOption) => void;
}

const FeedSortContext = createContext<FeedSortContextType | null>(null);

export const FeedSortProvider = ({ children }: { children: ReactNode }) => {
  const [sortType, setSortType] = useState<SortOption>("random");

  return (
    <FeedSortContext.Provider value={{ sortType, setSortType }}>
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
