import { ReactNode } from "react";

interface ScrollableRailProps {
  children: ReactNode;
  className?: string;
}

export const ScrollableRail = ({
  children,
  className = "",
}: ScrollableRailProps) => {
  return (
    <div className={`w-full mx-auto ${className}`}>
      <div className="relative group">
        {/* Scroll Container */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 scroll-smooth snap-x hide-scrollbar justify-start">
          {children}

          {/* Spacer for right-side fade visibility */}
          <div className="w-4 shrink-0"></div>
        </div>

        {/* Fade / Shadow Overlay */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-linear-to-l from-logo-offwhite to-transparent z-10 opacity-100 transition-opacity" />
      </div>
    </div>
  );
};
