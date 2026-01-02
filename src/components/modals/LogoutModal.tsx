import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";

/**
 * Simplified logout content for the global modal container.
 * uses css variables for consistent professional geometry.
 */
export const LogoutModal = () => {
  const { user, logout } = useAuth();
  const { closeModal } = useModal();

  const handleConfirm = async () => {
    try {
      await logout();
      closeModal();
    } catch (error) {
      console.error("failed to log out:", error);
    }
  };

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-semibold mb-6 text-slate-900 text-center">
        Sign out?
      </h2>

      {user && (
        /* user profile box: uses global preview and border tokens */
        <div className="w-full bg-bg-preview rounded-(--radius-input) p-4 mb-8 flex flex-col items-center border border-border-subtle">
          <div className="font-semibold text-logo-blue text-base">
            {user.displayName || "UCLA Student"}
          </div>
          <div className="text-xs text-slate-500 italic mt-0.5">
            {user.email}
          </div>
          <div className="text-xs text-slate-500 italic mt-0.5">
            ID: {user.uid}
          </div>
        </div>
      )}

      <div className="w-full flex flex-col gap-2">
        {/* primary action: destructive sign out */}
        <button
          className="inline-flex w-full items-center justify-center rounded-(--radius-button) bg-logo-red px-4 py-2.5 text-sm font-semibold text-white cursor-pointer transition-colors hover:bg-red-700"
          onClick={handleConfirm}
        >
          Sign out
        </button>

        {/* secondary action: ghost style cancel */}
        <button
          className="w-full rounded-(--radius-button) px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
          onClick={closeModal}
        >
          Stay signed in
        </button>
      </div>
    </div>
  );
};
