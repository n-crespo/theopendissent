import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";

/**
 * simplified logout content for the global modal container.
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
    <div className="modal-content" id="logout-view">
      <h2>Sign Out</h2>
      <p style={{ textAlign: "center", marginBottom: "15px" }}>
        Are you sure you want to log out?
      </p>

      {user && (
        <div className="user-profile-preview">
          <div className="profile-name">
            {user.displayName || "UCLA Student"}
          </div>
          <div className="profile-email">{user.email}</div>
        </div>
      )}

      <div className="modal-actions">
        <button className="btn btn-logout-confirm" onClick={handleConfirm}>
          Sign Out
        </button>

        <button className="btn btn-logout-cancel" onClick={closeModal}>
          Stay signed in
        </button>
      </div>
    </div>
  );
};
