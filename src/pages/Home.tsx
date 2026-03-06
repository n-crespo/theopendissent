import { FeedContainer } from "../components/feed/FeedContainer";
import { PostInput } from "../components/feed/PostInput";
import { FeedSortToggle } from "../components/home/FeedSortToggle";

export const Home = () => {
  return (
    <div className="flex flex-col gap-3">
      <FeedSortToggle />
      <PostInput />
      <FeedContainer />
    </div>
  );
};
