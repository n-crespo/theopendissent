import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { usePwa } from "../context/PwaContext";
import { SEO } from "../components/ui/Seo";

const rowClass =
  "flex w-full items-center gap-3 px-4 py-3.5 text-left font-semibold text-stone-800 transition-colors hover:bg-stone-50";

const initialsOf = (name: string) =>
  name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

export const You = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { deferredPrompt, install } = usePwa();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    if (!user) navigate("/", { replace: true });
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-4 pt-2">
      <SEO title="You" description="Your account" />

      <header className="flex items-center gap-3 px-1">
        <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-logo-blue font-bold text-white">
          {initialsOf(user.displayName || user.email || "?")}
        </span>
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-lg font-bold tracking-tight text-stone-900">
            {user.displayName || "UCLA Student"}
          </h1>
          <span className="truncate text-sm text-stone-500">{user.email}</span>
        </div>
      </header>

      <nav className="flex flex-col divide-y divide-stone-100 overflow-hidden rounded-card border border-stone-200 bg-white shadow-sm">
        <Link to="/profile?tab=posts" className={rowClass}>
          Your posts
          <i className="bi bi-chevron-right ml-auto text-stone-300"></i>
        </Link>
        <Link to="/profile?tab=replies" className={rowClass}>
          Your replies
          <i className="bi bi-chevron-right ml-auto text-stone-300"></i>
        </Link>
        <Link to="/settings" className={rowClass}>
          Settings
          <i className="bi bi-chevron-right ml-auto text-stone-300"></i>
        </Link>
        {(deferredPrompt || isIOS) && (
          <button
            className={rowClass}
            onClick={() =>
              deferredPrompt ? install() : openModal("installPwa")
            }
          >
            Install app
            <i className="bi bi-chevron-right ml-auto text-stone-300"></i>
          </button>
        )}
      </nav>

      <button
        className="w-max rounded-control px-4 py-2 font-semibold text-logo-red transition-colors hover:bg-stone-100"
        onClick={() => openModal("signOut")}
      >
        Log out
      </button>
    </div>
  );
};
