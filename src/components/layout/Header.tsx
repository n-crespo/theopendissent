import { useState } from "react";
import { Link } from "react-router-dom";
import logoUrl from "../../assets/Flat-Logo.svg";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import { useNotifications } from "../../hooks/useNotifications";
import { NavigationDrawer } from "./../ui/NavigationDrawer";
import { SidebarContent } from "./SidebarContent";

export const Header = () => {
  const { user, loading } = useAuth();
  const { openModal } = useModal();
  const { unreadCount } = useNotifications();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-logo-offwhite transform-gpu">
      {/* grid-cols-3 ensures the center of the middle column is the exact center of the header.
        h-14 gives the header a consistent height for the logo to scale within.
      */}
      <div className="mx-auto grid h-14 grid-cols-[17%_66%_17%] items-center max-w-115 lg:max-w-7xl">
        {/* Left Column (10%): Mobile Menu Toggle */}
        <div className="flex justify-start">
          <div className="lg:hidden">
            {!loading && (
              <button
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-all active:scale-95"
                onClick={() => setIsDrawerOpen(true)}
              >
                <i
                  className={
                    user ? "bi bi-person text-2xl" : "bi bi-list text-2xl"
                  }
                ></i>
              </button>
            )}
          </div>
        </div>

        {/* Center Column (80%): Logo (Massive) */}
        <div className="flex justify-center h-full py-1">
          <Link
            to="/"
            className="flex h-auto w-full items-center justify-center max-w-80"
          >
            <img
              src={logoUrl}
              alt="Logo"
              className="h-full w-full object-contain block"
              draggable="false"
            />
          </Link>
        </div>

        {/* Right Column (10%): Actions */}
        <div className="flex items-center justify-end">
          {loading ? (
            <div className="h-10 w-10 rounded-xl bg-slate-100 animate-pulse" />
          ) : user ? (
            <Link
              to="/notifications"
              className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-all active:scale-95"
            >
              <i className="bi bi-bell text-xl text-slate-500"></i>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-logo-red text-[10px] text-white font-bold ring-2 ring-logo-offwhite">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          ) : (
            <div className="lg:hidden">
              <button
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-all active:scale-95"
                onClick={() => openModal("signin")}
              >
                {/* <span className="text-[13px] font-bold whitespace-nowrap"> */}
                {/*   Sign In */}
                {/* </span> */}
                <i className="bi bi-box-arrow-in-left text-2xl"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        side="left"
      >
        <SidebarContent closeDrawer={() => setIsDrawerOpen(false)} />
      </NavigationDrawer>
    </header>
  );
};
