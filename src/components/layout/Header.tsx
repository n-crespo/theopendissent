import { Link } from "react-router-dom";
import logoUrl from "../../assets/Flat-Logo.svg";

/** Phone top bar. From the rail breakpoint up the feed shows the logo itself. */
export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-stone-200 bg-logo-offwhite pt-[env(safe-area-inset-top)] transform-gpu rail:hidden">
      <div className="mx-auto flex h-14 max-w-160 items-center px-3">
        <Link to="/" aria-label="Home">
          <img
            src={logoUrl}
            alt="The Open Dissent"
            className="block h-4.5 w-auto"
            draggable="false"
          />
        </Link>
      </div>
    </header>
  );
};
