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

          {/* Spacer for right-side fade visibility */}
          <div className="w-4 shrink-0"></div>
        </div>

        {/* Fade / Shadow Overlay - only visible when content overflows right */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-linear-to-l from-logo-offwhite to-transparent z-10 opacity-100 transition-opacity" />
      </div>
    </div>
  );
};
