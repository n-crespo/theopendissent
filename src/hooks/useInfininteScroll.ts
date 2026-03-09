import { useEffect, useRef } from "react";

interface UseInfiniteScrollProps {
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
}

export const useInfiniteScroll = ({
  loading,
  hasMore,
  onLoadMore,
  rootMargin = "400px",
}: UseInfiniteScrollProps) => {
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = observerRef.current;
    if (!element || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [target] = entries;
        // only trigger if not loading and actually visible
        if (target.isIntersecting && !loading) {
          onLoadMore();
        }
      },
      { rootMargin, threshold: 0.1 },
    );

    observer.observe(element);

    // cleanup ensures we don't have multiple observers running
    return () => observer.disconnect();
  }, [loading, hasMore, onLoadMore, rootMargin]);

  return observerRef;
};
