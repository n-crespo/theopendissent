import { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

const gradientClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-logo-red via-logo-green to-logo-blue animate-shimmer bg-size-[200%_auto] px-4 py-2.5 text-sm font-semibold text-white cursor-pointer transition-all hover:brightness-110";

const Arrow = () => (
  <i className="bi bi-arrow-right transition-transform animate-bounceHorizontal"></i>
);

/** Full-width call to action, the primary button in the about modals. */
export const GradientButton = ({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className={gradientClass} {...props}>
    {children}
    <Arrow />
  </button>
);

/** GradientButton for external links, with an optional logo before the label. */
export const GradientLink = ({
  img,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { img?: string }) => (
  <a className={gradientClass} target="_blank" rel="noreferrer" {...props}>
    {img && (
      <img
        src={img}
        alt=""
        width={20}
        height={20}
        className="h-5 w-5 shrink-0 rounded-sm bg-white object-contain"
      />
    )}
    {children}
    <Arrow />
  </a>
);
