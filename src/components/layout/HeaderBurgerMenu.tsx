import { useModal } from "../../context/ModalContext";
import { usePwa } from "../../context/PwaContext";
import { DropdownMenu, MenuItem, MenuSeparator } from "../ui/DropdownMenu";

export const HeaderBurgerMenu = () => {
  const { openModal } = useModal();

  const handleAbout = () => openModal("about");
  const handleFeedback = () =>
    window.open("https://forms.gle/EA1DcFzigrmjRqZK8", "_blank");

  const { deferredPrompt, install } = usePwa();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

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
      <MenuItem
        icon="bi-question-lg"
        label="What is this?"
        onClick={handleAbout}
      />
      <MenuItem
        icon="bi-chat-square-heart"
        label="Follow Us!"
        onClick={() => openModal("joinTeam")}
      />
      <MenuSeparator />

      {(deferredPrompt || isIOS) && (
        <>
          <MenuItem
            icon="bi-download"
            label="Install"
            onClick={() => {
              if (deferredPrompt) {
                install();
              } else if (isIOS) {
                openModal("installPwa");
              }
            }}
          />
          <MenuSeparator />
        </>
      )}

      <MenuItem
        icon="bi-chat-text"
        label="Send Feedback"
        onClick={handleFeedback}
      />
    </DropdownMenu>
  );
};
