import { Link } from "react-router-dom";
import logoUrl from "../../assets/Flat-Logo.svg";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import { HeaderUserMenu } from "./HeaderUserMenu";
import { HeaderBurgerMenu } from "./HeaderBurgerMenu";

const PILL_BUTTON_STYLE =
  "group flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-logo-offwhite text-slate-600 hover:text-slate-900 transition-all active:scale-95 cursor-pointer shadow-sm";

export const Header = () => {
  const { user, loading } = useAuth();
  const { openModal } = useModal();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-logo-offwhite transform-gpu">
      <div className="mx-auto flex max-w-125 items-center justify-between px-0 py-2">
        {/* left side: menu button */}
        <div className="flex w-20 items-center justify-start pl-2">
          <HeaderBurgerMenu />
        </div>

        {/* logo */}
        <Link to="/" className="flex items-start justify-center">
          <img
            src={logoUrl}
            alt="App Icon"
            className="h-full w-auto"
            draggable="false"
          />
        </Link>

        {/* right side: auth profile */}
        <div
          id="auth-section"
          className="flex w-20 items-center justify-end pr-2"
        >
          {loading ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-logo-offwhite shadow-sm active:scale-95">
              <i className=""></i>
            </div>
          ) : user ? (
            <HeaderUserMenu />
          ) : (
            <button
              className={PILL_BUTTON_STYLE}
              onClick={() => openModal("signin")}
            >
              <span className="text-[13px] font-bold whitespace-nowrap">
                Sign In
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
