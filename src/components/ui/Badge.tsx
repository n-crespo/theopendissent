interface BadgeProps {
  label: string;
  variant: "green" | "blue" | "slate" | "red";
}

const variantStyles: Record<BadgeProps["variant"], string> = {
  green: "bg-logo-green text-white",
  blue: "bg-logo-blue text-white",
  slate: "bg-slate-200 text-slate-500",
  red: "bg-logo-red text-white",
};

export const Badge = ({ label, variant }: BadgeProps) => (
  <span
    className={`text-xs font-semibold leading-tight px-1.5 py-0.5 rounded ${variantStyles[variant]}`}
  >
    {label}
  </span>
);
