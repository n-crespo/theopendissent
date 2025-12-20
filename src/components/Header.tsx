import headIconUrl from "../assets/icons/head.svg";
import logoUrl from "../assets/Flat-Logo.svg";
import helpIconUrl from "../assets/icons/help.svg";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";

export const Header = () => {
  const { user } = useAuth();
  const { openModal } = useModal();

  return (
    <header>
      <div id="header-content">
        <button className="btn" onClick={() => openModal("help")}>
          <img src={helpIconUrl} alt="Help Icon" />
        </button>

        <img src={logoUrl} alt="App Icon" id="header-icon" draggable="false" />

        {user ? (
          <button
            className="btn signed-in"
            onClick={() => openModal("logout")}
            title={`Signed in as ${user.email?.split("@")[0]}`}
          >
            <i className="bi bi-box-arrow-right"></i>
          </button>
        ) : (
          <button
            className="btn"
            onClick={() => openModal("signin")}
            title="Sign In"
          >
            <img src={headIconUrl} alt="Head Icon" />
          </button>
        )}
      </div>
    </header>
  );
};
