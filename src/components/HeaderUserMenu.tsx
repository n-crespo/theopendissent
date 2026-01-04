import { useNavigate } from "react-router-dom";
import { useModal } from "../context/ModalContext";
import { DropdownMenu, MenuItem, MenuSeparator } from "./ui/DropdownMenu";

export const HeaderUserMenu = () => {
  const { openModal } = useModal();
  const navigate = useNavigate();

  const handleHome = () => navigate("/");
  const handleProfile = () => navigate("/profile");
  const handleListen = () => openModal("listen");
  const handleFeedback = () =>
    window.open("https://forms.gle/EA1DcFzigrmjRqZK8", "_blank");

  return (
    <DropdownMenu
      align="right"
      width="w-48"
      trigger={
        <div className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-slate-200/50 bg-slate-100 text-slate-500 transition-all shadow-sm active:scale-95">
          <i className="bi bi-person-fill text-lg"></i>
        </div>
      }
    >
      <MenuItem icon="bi-house-door" label="Home" onClick={handleHome} />
      <MenuItem icon="bi-person" label="Profile" onClick={handleProfile} />

      <MenuSeparator />

      {/* New Listen Item */}
      <MenuItem icon="bi-broadcast" label="Listen" onClick={handleListen} />

      <MenuItem
        icon="bi-chat-text"
        label="Send Feedback"
        onClick={handleFeedback}
      />

      <MenuSeparator />

      <MenuItem
        icon="bi-box-arrow-right"
        label="Log Out"
        onClick={() => openModal("logout")}
        variant="danger"
      />
    </DropdownMenu>
  );
};
