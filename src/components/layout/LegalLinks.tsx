import { Link } from "react-router-dom";
import { LINKS } from "../../lib/links";

const linkClass = "hover:text-stone-800 hover:underline underline-offset-3";

export const LegalLinks = () => (
  <p className="flex flex-wrap gap-x-2 text-xs leading-relaxed text-stone-500">
    <span>© 2026 The Open Dissent</span>
    <Link to="/privacy" className={linkClass}>
      Privacy
    </Link>
    <Link to="/terms" className={linkClass}>
      Terms
    </Link>
    <a
      href={LINKS.source}
      target="_blank"
      rel="noreferrer"
      className={linkClass}
    >
      Source
    </a>
  </p>
);
