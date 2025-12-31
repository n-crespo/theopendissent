import { Chip } from "./Chip";
import { PodcastSourceChip } from "./PodcastSourceChip";
import { InstallPwaChip } from "./InstallPwaChip";

export const DiscoveryRail = () => {
  return (
    <div className="w-full mx-auto">
      <div className="relative group">
        {/* Scroll Container */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 scroll-smooth snap-x hide-scrollbar justify-start">
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

          {/* Spacer for right-side fade visibility if needed */}
          <div className="w-4 shrink-0"></div>
        </div>

        {/* Fade / Shadow Overlay - only visible when content overflows right */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-linear-to-l from-logo-offwhite to-transparent z-10 opacity-0 transition-opacity" />
      </div>
    </div>
  );
};
