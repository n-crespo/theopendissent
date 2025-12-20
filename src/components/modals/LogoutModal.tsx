import { Modal } from "./Modal";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";

export const LogoutModal = () => {
  const { user, logout } = useAuth();
  const { closeModal } = useModal();

  const handleConfirm = async () => {
    await logout();
    closeModal();
  };

  return (
    <Modal id="logout-view" onClose={closeModal}>
      <h2>Sign Out</h2>
      <div className="modal-content">
        <p style={{ textAlign: "center", marginBottom: "10px" }}>
          Are you sure you want to log out?
        </p>

        {user && (
          <div
            style={{
              textAlign: "center",
              backgroundColor: "var(--offwhite-background)",
              padding: "15px",
              borderRadius: "var(--border-rad)",
              marginBottom: "20px",
              border: "1px solid var(--border-fg)",
            }}
          >
            <div style={{ fontWeight: "bold", color: "var(--text)" }}>
              {user.displayName || "UCLA Student"}
            </div>
            <div style={{ fontSize: "14px", color: "var(--gray)" }}>
              {user.email}
            </div>
          </div>
        )}
      </div>

      <button className="btn-logout-confirm" onClick={handleConfirm}>
        Sign Out
      </button>

      <button className="btn-logout-cancel" onClick={closeModal}>
        Stay signed in
      </button>
    </Modal>
  );
};
