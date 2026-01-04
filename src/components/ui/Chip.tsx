import { ReactNode, HTMLAttributes } from "react";

interface ChipProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  icon?: ReactNode;
  as?: "div" | "button" | "a";
  isActive?: boolean;
  href?: string;
  target?: string;
  rel?: string;
}

export const Chip = ({
  children,
  icon,
  onClick,
  className = "",
  as = "div",
  isActive = false, // Default to false
  ...props
}: ChipProps) => {
  const Component = as as any;

  // Conditional styles for Active vs Inactive state
  const baseStyles =
    "group inline-flex items-center gap-3 rounded-full border py-1.5 pl-1.5 pr-4 transition-all duration-300 cursor-pointer active:scale-95";

  const activeStyles = "bg-slate-800 border-slate-800 text-white shadow-md";
  const inactiveStyles =
    "bg-white border-slate-200 text-slate-600 hover:border-slate-300";

  return (
    <Component
      onClick={onClick}
      className={`
        ${baseStyles}
        ${isActive ? activeStyles : inactiveStyles}
        ${className}
      `}
      {...props}
    >
      {/* Optional Icon Slot */}
      {icon && (
        <div
          className={`
            flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors
            ${
              isActive
                ? "bg-slate-700 border-slate-600 text-slate-200"
                : "bg-slate-100 border-slate-200/50 text-slate-500"
            }
          `}
        >
          {icon}
        </div>
      )}

      {/* Content Slot */}
      <div
        className={`
        text-xs font-semibold tracking-tight whitespace-nowrap
        ${isActive ? "text-white" : "text-slate-600"}
      `}
      >
        {children}
      </div>
    </Component>
  );
};
