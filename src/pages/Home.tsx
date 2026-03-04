import { DiscoveryRail } from "../components/discovery/DiscoveryRail";
import { PostInput } from "../components/feed/PostInput";
import { FeedContainer } from "../components/feed/FeedContainer";

export const Home = () => {
  return (
    <div className="flex flex-col gap-3">
      <DiscoveryRail />
      <PostInput />
      <FeedContainer />
    </div>
  );
};
