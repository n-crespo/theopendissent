import logoUrl from "../assets/Flat-Logo.svg";
import { FeedContainer } from "../components/feed/FeedContainer";
import { SEO } from "../components/ui/Seo";
import { FeedSortToggle } from "../components/home/FeedSortToggle";
import { ComposeTrigger } from "../components/feed/ComposeTrigger";

export const Home = () => {
  return (
    <div className="flex flex-col gap-3">
      <SEO title="Home" />
      {/* phones get the logo from Header */}
      <img
        src={logoUrl}
        alt="The Open Dissent"
        className="hidden h-5.5 w-auto self-start rail:block"
        draggable="false"
      />
      <ComposeTrigger placeholder="What's on your mind?" />
      <FeedSortToggle />
      <FeedContainer />
    </div>
  );
};
