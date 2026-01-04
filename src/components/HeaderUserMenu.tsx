import { useModal } from "../context/ModalContext";
import { DropdownMenu, MenuItem, MenuSeparator } from "./DropdownMenu";

export const HeaderUserMenu = () => {
  const { openModal } = useModal();

  const handleHome = () => {
    window.location.href = "/";
  };

  return (
    <DropdownMenu
      align="right"
      width="w-48"
      trigger={
        // Updated to match PostItem profile style:
        // - rounded-md (instead of rounded-full)
        // - bg-slate-100 (instead of bg-logo-offwhite)
        // - border-slate-200/50
        <div className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-slate-200/50 bg-slate-100 text-slate-500 transition-all shadow-sm active:scale-95">
          <i className="bi bi-person-fill text-lg"></i>
        </div>
      }
    >
      <MenuItem icon="bi-house-door" label="Home" onClick={handleHome} />

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
