import { DiscoveryRail } from "../components/discovery/DiscoveryRail";
import { PostInput } from "../components/feed/PostInput";
import { PostList } from "../components/feed/PostList";
import { FeedSortProvider } from "../context/FeedSortContext";

export const Home = () => {
  return (
    <FeedSortProvider>
      <div className="mx-auto flex max-w-125 flex-col gap-3 px-2">
        <DiscoveryRail />
        <PostInput />
        <PostList />
      </div>
    </FeedSortProvider>
  );
};
