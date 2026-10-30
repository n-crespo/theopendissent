import { FeedContainer } from "../components/feed/FeedContainer";
import { SEO } from "../components/ui/Seo";
import { FeedSortToggle } from "../components/home/FeedSortToggle";
import { ComposeTrigger } from "../components/feed/ComposeTrigger";

export const Home = () => {
  return (
    <div className="flex flex-col gap-3">
      <SEO title="Home" />
      <ComposeTrigger placeholder="What's on your mind?" />
      <FeedSortToggle />
      <FeedContainer />
    </div>
  );
};
