import { DiscoveryRail } from "../components/discovery/DiscoveryRail";
import { PostInput } from "../components/feed/PostInput";
import { FeedContainer } from "../components/feed/FeedContainer";
import { FeedSortProvider } from "../context/FeedSortContext";

export const Home = () => {
  return (
    <FeedSortProvider>
      <div className="flex flex-col gap-4">
        <DiscoveryRail />
        <PostInput />
        <FeedContainer />
      </div>
    </FeedSortProvider>
  );
};
