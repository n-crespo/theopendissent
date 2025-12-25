import headIconUrl from "../assets/icons/head.svg";
import logoUrl from "../assets/Flat-Logo.svg";
import helpIconUrl from "../assets/icons/help.svg";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";

export const Header = () => {
  const { user, loading } = useAuth();
  const { openModal } = useModal();

  return (
    <header className="sticky top-0 z-50 rounded-b-lg border-b border-slate-200 bg-logo-offwhite">
      <div className="mx-auto flex max-w-[500px] items-center justify-between px-0 py-0">
        {/* help button */}
        <button
          className="flex h-[50px] w-auto cursor-pointer items-center justify-center border-none bg-logo-offwhite p-[10px] text-slate-800"
          onClick={() => openModal("help")}
        >
          <img
            src={helpIconUrl}
            alt="Help Icon"
            className="h-[90%] max-h-[60px] w-auto"
          />
        </button>

        {/* main logo */}
        <img
          src={logoUrl}
          alt="App Icon"
          className="m-0 h-full w-auto max-w-[85vw]"
          draggable="false"
        />

        <div
          id="auth-section"
          className="flex w-[50px] items-center justify-center"
        >
          {loading ? (
            <div className="flex h-[50px] items-center justify-center p-[10px] opacity-50">
              <i className="bi bi-three-dots text-slate-400"></i>
            </div>
          ) : user ? (
            <button
              className="group flex h-[50px] w-auto cursor-pointer items-center justify-center border-none bg-logo-offwhite p-[10px] transition-colors hover:rounded-lg hover:bg-black/5"
              onClick={() => openModal("logout")}
              title={`Signed in as ${user.email?.split("@")[0]}`}
            >
              <i className="bi bi-box-arrow-right text-[30px] font-black text-logo-red"></i>
            </button>
          ) : (
            <button
              className="flex h-[50px] w-auto cursor-pointer items-center justify-center border-none bg-logo-offwhite p-[10px] text-slate-800"
              onClick={() => openModal("signin")}
              title="Sign In"
            >
              <img
                src={headIconUrl}
                alt="Head Icon"
                className="h-[90%] max-h-[60px] w-auto"
              />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
