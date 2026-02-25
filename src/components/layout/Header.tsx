import { Link } from "react-router-dom";
import logoUrl from "../../assets/Flat-Logo.svg";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import { HeaderUserMenu } from "./HeaderUserMenu";
import { HeaderBurgerMenu } from "./HeaderBurgerMenu";
import { useNotifications } from "../../hooks/useNotifications";

const PILL_BUTTON_STYLE =
  "group flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-logo-offwhite text-slate-600 hover:text-slate-900 transition-all active:scale-95 cursor-pointer shadow-sm";

export const Header = () => {
  const { user, loading } = useAuth();
  const { openModal } = useModal();
  const { unreadCount } = useNotifications(); // Access unread count

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-logo-offwhite transform-gpu">
      <div className="mx-auto flex max-w-125 items-center justify-between px-2 py-2">
        <HeaderBurgerMenu />
        <Link
          to="/"
          className="flex items-center xs: ml-1 sm:ml-5 md:ml-5 lg:md-5"
        >
          <img
            src={logoUrl}
            alt="App Icon"
            className="h-auto w-auto md:h-full"
            draggable="false"
          />
        </Link>

        {/* Right: Notifications + User Menu */}
        <div
          id="auth-section"
          className="flex items-center gap-2 sm:ml-3 md:ml-1"
        >
          {!loading && user && (
            <Link
              to="/notifications"
              className="relative flex items-center justify-center rounded-full transition-colors active:scale-95 px-2"
            >
              <i className="bi bi-bell text-lg text-slate-400"></i>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-logo-red text-[10px] text-white font-bold ring-2 ring-logo-offwhite animate-in zoom-in duration-300">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          {loading ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/50 bg-slate-100 text-slate-500 shadow-sm">
              {/* Spacer */}
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
