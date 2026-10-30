export const UnreadBadge = ({
  count,
  className,
}: {
  count: number;
  className: string;
}) => {
  if (count <= 0) return null;

  return (
    <span
      className={`absolute flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-logo-red px-1 text-2xs font-bold text-white ring-2 ring-logo-offwhite ${className}`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
};
