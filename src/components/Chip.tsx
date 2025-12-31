import { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  icon?: ReactNode; // Optional left-side icon
  onClick?: () => void;
  className?: string;
  as?: "div" | "button" | "a"; // Polymorphic prop
  href?: string;
}

export const Chip = ({
  children,
  icon,
  onClick,
  className = "",
  as = "div",
  ...props
}: ChipProps) => {
  const Component = as as any;

  return (
    <Component
      onClick={onClick}
      className={`
        group inline-flex items-center gap-3 rounded-full
        bg-white border border-border-subtle
        py-1.5 pl-1.5 pr-4
        transition-all duration-300
        hover:border-slate-300
        cursor-default ${onClick || as === "a" ? "cursor-pointer active:scale-95" : ""}
        ${className}
      `}
      {...props}
    >
      {/* Optional Icon Slot - Styled like PostItem avatar */}
      {icon && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 border border-slate-200/50 group-hover:bg-slate-200 transition-colors">
          {icon}
        </div>
      )}

      {/* Content Slot */}
      <div className="text-xs font-semibold text-slate-600 tracking-tight whitespace-nowrap">
        {children}
      </div>
    </Component>
  );
};
