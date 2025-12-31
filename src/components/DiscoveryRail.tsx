import { Chip } from "./Chip";
import { PodcastSourceChip } from "./PodcastSourceChip";
import { InstallPwaChip } from "./InstallPwaChip";

export const DiscoveryRail = () => {
  return (
    // Changed: Removed max-w/mx-auto. Added -mx-4 to pull edges to the screen.
    <div className="relative mx-4 -ml-px">
      <div className="flex items-center gap-2 overflow-x-auto px-4 pt-2 scroll-smooth snap-x  hide-scrollbar">
        <div className="snap-start shrink-0">
          <PodcastSourceChip />
        </div>

        <div className="snap-start shrink-0">
          <InstallPwaChip />
        </div>

        <div className="snap-start shrink-0">
          <Chip
            as="button"
            onClick={() => console.log("Clicked Trending")}
            icon={<i className="bi bi-graph-up-arrow text-logo-blue"></i>}
          >
            Trending: #TechRegulation
          </Chip>
        </div>

        <div className="snap-start shrink-0">
          <Chip
            icon={<i className="bi bi-exclamation-circle text-logo-red"></i>}
          >
            Live Debate: 8:00 PM EST
          </Chip>
        </div>

        <div className="snap-start shrink-0">
          <Chip
            as="button"
            icon={<i className="bi bi-hash text-slate-400"></i>}
          >
            Politics
          </Chip>
        </div>

        <div className="snap-start shrink-0">
          <Chip
            as="button"
            icon={<i className="bi bi-hash text-slate-400"></i>}
          >
            Economy
          </Chip>
        </div>

        {/* Spacer for right-side fade */}
        <div className="w-8 shrink-0"></div>
      </div>

      {/* Fade / Shadow Overlay */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-linear-to-l from-logo-offwhite to-transparent z-10" />
    </div>
  );
};
