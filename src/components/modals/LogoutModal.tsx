import { User } from "firebase/auth";
import { Modal } from "./Modal";

interface LogoutModalProps {
  user: User | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutModal = ({ user, onClose, onConfirm }: LogoutModalProps) => {
  return (
    <Modal id="logout-view" onClose={onClose}>
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

      <button className="btn-logout-confirm" onClick={onConfirm}>
        Sign Out
      </button>

      <button className="btn-logout-cancel" onClick={onClose}>
        Stay signed in
      </button>
    </Modal>
  );
};
