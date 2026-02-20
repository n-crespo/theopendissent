import { useModal } from "../../context/ModalContext";
import { DropdownMenu, MenuItem, MenuSeparator } from "../ui/DropdownMenu";

export const HeaderBurgerMenu = () => {
  const { openModal } = useModal();

  const handleListen = () => openModal("listen");
  const handleAbout = () => openModal("about");
  const handleFeedback = () =>
    window.open("https://forms.gle/EA1DcFzigrmjRqZK8", "_blank");

  return (
    <DropdownMenu
      align="left"
      width="w-48"
      trigger={
        <div className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-all active:scale-95">
          <i className="bi bi-list text-3xl"></i>
        </div>
      }
    >
      <MenuItem icon="bi-question-lg" label="About" onClick={handleAbout} />
      <MenuSeparator />
      <MenuItem icon="bi-broadcast-pin" label="Listen" onClick={handleListen} />
      <MenuItem
        icon="bi-rocket-takeoff"
        label="Join the Team"
        onClick={() => openModal("joinTeam")}
      />
      <MenuItem
        icon="bi-chat-text"
        label="Send Feedback"
        onClick={handleFeedback}
      />
    </DropdownMenu>
  );
};
