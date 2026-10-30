import { ReactNode } from "react";

interface TextLinkProps {
  href: string;
  /** brand logo from public/ shown before the label */
  logo?: string;
  children: ReactNode;
}

/** Plain underlined external link for running text. */
export const TextLink = ({ href, logo, children }: TextLinkProps) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="whitespace-nowrap text-stone-800 underline decoration-stone-300 underline-offset-3 transition-colors hover:decoration-stone-700"
  >
    {logo && (
      <img
        src={logo}
        alt=""
        width={14}
        height={14}
        loading="lazy"
        className="mr-1 inline-block h-3.5 w-3.5 rounded-[3px] object-contain align-[-0.15em]"
      />
    )}
    {children}
  </a>
);
