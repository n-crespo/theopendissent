import { FeedContainer } from "../components/feed/FeedContainer";
import { SEO } from "../components/ui/Seo";
import { FeedSortToggle } from "../components/home/FeedSortToggle";

export const Home = () => {
  return (
    <div className="flex flex-col gap-3">
      <SEO title="Home" />
      <FeedSortToggle />
      <FeedContainer />
    </div>
  );
};
