import { ListenChip } from "./ListenChip";
import { InstallPwaChip } from "./InstallPwaChip";
import { usePwa } from "../context/PwaContext";
import { ScrollableRail } from "./ui/ScrollableRail";
import { SortChip } from "./SortChip";
import { SocialsChip } from "./SocialsChip";

export const DiscoveryRail = () => {
  const { deferredPrompt } = usePwa();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <ScrollableRail>
      <div className="snap-start shrink-0">
        <SortChip />
      </div>

      <div className="snap-start shrink-0">
        <ListenChip />
      </div>

      {(deferredPrompt || isIOS) && (
        <div className="snap-start shrink-0">
          <InstallPwaChip />
        </div>
      )}

      <div className="snap-start shrink-0">
        <SocialsChip />
      </div>
    </ScrollableRail>
  );
};
