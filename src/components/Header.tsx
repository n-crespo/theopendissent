// src/components/Header.tsx
import headIconUrl from "../assets/icons/head.svg";
import logoUrl from "../assets/Flat-Logo.svg";
import helpIconUrl from "../assets/icons/help.svg";

import { User } from "firebase/auth";

interface HeaderProps {
  user: User | null;
  onOpenHelp: () => void;
  onOpenSignIn: () => void;
  onLogout: () => void;
}

export const Header = ({
  user,
  onOpenHelp,
  onOpenSignIn,
  onLogout,
}: HeaderProps) => {
  return (
    <header>
      <div id="header-content">
        <button id="help-btn" className="btn" onClick={onOpenHelp}>
          <img src={helpIconUrl} alt="Help Icon" />
        </button>

        <img src={logoUrl} alt="App Icon" id="header-icon" draggable="false" />

        {user ? (
          <button
            className="btn signed-in"
            onClick={onLogout}
            title={`Signed in as ${user.email?.split("@")[0]}`}
          >
            <i className="bi bi-box-arrow-right"></i>
          </button>
        ) : (
          <button className="btn" onClick={onOpenSignIn} title="Sign In">
            <img src={headIconUrl} alt="Head Icon" />
          </button>
        )}
      </div>
    </header>
  );
};
