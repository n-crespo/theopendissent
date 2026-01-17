import { Chip } from "./ui/Chip";
import { PodcastSourceChip } from "./PodcastSourceChip";
import { InstallPwaChip } from "./InstallPwaChip";
import { usePwa } from "../context/PwaContext";
import { ScrollableRail } from "./ui/ScrollableRail";
// import { JoinTeamChip } from "./JoinTeamChip";
import { SortChip } from "./SortChip";

export const DiscoveryRail = () => {
  const { deferredPrompt } = usePwa();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <ScrollableRail>
      <div className="snap-start shrink-0">
        <SortChip />
      </div>

      <div className="snap-start shrink-0">
        <PodcastSourceChip />
      </div>

      {/* <JoinTeamChip />*/}

      {(deferredPrompt || isIOS) && (
        <div className="snap-start shrink-0">
          <InstallPwaChip />
        </div>
      )}

      {/* Instagram */}
      <div className="snap-start shrink-0">
        <Chip
          as="a"
          href="https://www.instagram.com/theopendissent/"
          target="_blank"
          rel="noopener noreferrer"
          icon={<i className="bi bi-instagram text-[#E1306C]"></i>}
          className="hover:border-[#E1306C]/40 transition-colors"
        >
          Instagram
        </Chip>
      </div>

      {/* LinkedIn */}
      <div className="snap-start shrink-0">
        <Chip
          as="a"
          href="https://www.linkedin.com/company/the-open-dissent"
          target="_blank"
          rel="noopener noreferrer"
          icon={<i className="bi bi-linkedin text-[#0077B5]"></i>}
          className="hover:border-[#0077B5]/40 transition-colors"
        >
          LinkedIn
        </Chip>
      </div>
    </ScrollableRail>
  );
};
