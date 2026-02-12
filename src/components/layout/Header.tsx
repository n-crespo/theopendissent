import { Link } from "react-router-dom";
import logoUrl from "../../assets/Flat-Logo.svg";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import { HeaderUserMenu } from "./HeaderUserMenu";

const PILL_BUTTON_STYLE =
  "group flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-logo-offwhite text-slate-600 hover:text-slate-900 transition-all active:scale-95 cursor-pointer shadow-sm";

export const Header = () => {
  const { user, loading } = useAuth();
  const { openModal } = useModal();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 rounded-b-lg border-b border-slate-200 bg-logo-offwhite transform-gpu">
      <div className="mx-auto flex max-w-125 items-center justify-between px-0 py-0">
        {/* left: info button */}
        <div className="flex w-20 items-center justify-start pl-2">
          <button
            className={PILL_BUTTON_STYLE}
            onClick={() => openModal("about")}
          >
            <span className="text-[15px] font-bold whitespace-nowrap px-1">
              ?
            </span>
          </button>
        </div>

        {/* center (main logo) */}
        <Link to="/" className="flex h-12.5 items-center justify-center">
          <img
            src={logoUrl}
            alt="App Icon"
            className="h-full w-auto max-w-[60vw] object-contain"
            draggable="false"
          />
        </Link>

        {/* auth section */}
        <div
          id="auth-section"
          className="flex w-20 items-center justify-end pr-2"
        >
          {loading ? (
            <div className="flex items-center justify-center opacity-50">
              <i className="bi bi-three-dots text-slate-400"></i>
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
