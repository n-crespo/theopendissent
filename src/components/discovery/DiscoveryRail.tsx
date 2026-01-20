import { ListenChip } from "./chips/ListenChip";
import { InstallPwaChip } from "./chips/InstallPwaChip";
import { usePwa } from "../../context/PwaContext";
import { ScrollableRail } from "../ui/ScrollableRail";
import { SortChip } from "./chips/SortChip";
import { FollowUsChip } from "./chips/FollowUsChip";

export const DiscoveryRail = () => {
  const { deferredPrompt } = usePwa();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <ScrollableRail>
      <div className="snap-start shrink-0">
        <SortChip />
      </div>

      <div className="snap-start shrink-0">
        <FollowUsChip />
      </div>

      <div className="snap-start shrink-0">
        <ListenChip />
      </div>

      {(deferredPrompt || isIOS) && (
        <div className="snap-start shrink-0">
          <InstallPwaChip />
        </div>
      )}
    </ScrollableRail>
  );
};
