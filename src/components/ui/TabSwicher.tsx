import { motion } from "framer-motion";

interface Tab {
  id: string;
  label: string;
  count?: number | string;
}

interface TabSwitcherProps {
  tabs: Tab[];
  activeId: string;
  onChange: (id: any) => void;
  underlineWidth?: string; // allow overriding the indicator width
}

export const TabSwitcher = ({
  tabs,
  activeId,
  onChange,
  underlineWidth = "w-full",
}: TabSwitcherProps) => {
  return (
    <div className="flex w-full border-b border-slate-100">
      {tabs.map((tab) => {
        const isActive = activeId === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex-1 flex items-center justify-center py-3 text-md font-bold transition-colors ${
              isActive
                ? "text-slate-900"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`text-xs transition-opacity ${isActive ? "opacity-100" : "opacity-40"}`}
                >
                  {tab.count}
                </span>
              )}
            </span>

            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-1 ${underlineWidth} bg-logo-blue rounded-full`}
                transition={{ type: "spring", bounce: 0.1, duration: 0.3 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
