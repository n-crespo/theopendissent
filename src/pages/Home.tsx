import { DiscoveryRail } from "../components/DiscoveryRail";
import { PostInput } from "../components/PostInput";
import { PostList } from "../components/PostList";

export const Home = () => {
  return (
    <div className="mx-auto flex max-w-125 flex-col gap-3 px-2">
      <DiscoveryRail />
      <PostInput />
      <PostList />
    </div>
  );
};
