import { ListenChip } from "./chips/ListenChip";
import { InstallPwaChip } from "./chips/InstallPwaChip";
import { usePwa } from "../../context/PwaContext";
import { ScrollableRail } from "../ui/ScrollableRail";
import { SortChip } from "./chips/SortChip";
import { FollowUsChip } from "./chips/FollowUsChip";
import { JoinTeamChip } from "./chips/JoinTeamChip";

export const DiscoveryRail = () => {
  return (
    <ScrollableRail>
      <div className="snap-start shrink-0">
        <SortChip />
      </div>

      <div className="snap-start shrink-0">
        <ListenChip />
      </div>

      <div className="snap-start shrink-0">
        <JoinTeamChip />
      </div>

      {/* <MenuItem
        icon="bi-rocket-takeoff"
        label="Join the Team"
        onClick={() => openModal("joinTeam")}
      />*/}

      <div className="snap-start shrink-0">
        <FollowUsChip />
      </div>
    </ScrollableRail>
  );
};
