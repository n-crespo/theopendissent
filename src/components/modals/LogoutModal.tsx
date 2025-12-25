import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";

/**
 * simplified logout content for the global modal container.
 * uses logo- red branding and utility-based profile preview.
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
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4 text-[#1a1a1a]">Sign Out?</h2>

      {user && (
        <div className="w-full bg-slate-50 rounded-lg p-4 mb-6 flex flex-col items-center border border-slate-100">
          <div className="font-semibold text-logo-blue text-lg">
            {user.displayName || "UCLA Student"}
          </div>
          <div className="text-sm text-gray-custom opacity-70 italic">
            {user.email}
          </div>
        </div>
      )}

      <div className="w-full flex flex-col items-center">
        {/* .btn-logout-confirm */}
        <button
          className="inline-flex w-full items-center justify-center rounded-lg bg-logo-red p-3 text-base font-semibold text-white cursor-pointer border-none transition-all duration-200 hover:opacity-90 hover:shadow-[0_4px_12px_rgba(112,22,30,0.2)]"
          onClick={handleConfirm}
        >
          Sign Out
        </button>

        {/* .btn-logout-cancel */}
        <button
          className="w-full mt-[15px] p-2 bg-none border-none text-sm text-gray-custom cursor-pointer transition-all hover:text-[#222222] hover:underline"
          onClick={closeModal}
        >
          Stay signed in
        </button>
      </div>
    </div>
  );
};
