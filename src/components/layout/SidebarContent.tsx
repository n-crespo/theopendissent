import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import { usePwa } from "../../context/PwaContext";
import { DrawerItem } from "../ui/NavigationDrawer";
import { SocialLinksRow } from "../home/SocialLinksRow";
import { useNavigate } from "react-router-dom";

export const SidebarContent = ({
  closeDrawer,
}: {
  closeDrawer?: () => void;
}) => {
  const { user } = useAuth();
  const { openModal } = useModal();
  const { deferredPrompt, install } = usePwa();
  const navigate = useNavigate();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const handleNav = (path: string) => {
    navigate(path);
    if (closeDrawer) closeDrawer();
  };

  return (
    <div className="flex flex-col h-full min-h-[inherit]">
      {/* scrollable navigation section */}
      <div className="flex-1 overflow-y-auto custom-scrollbar font-bold text-xl px-4 py-2">
        <DrawerItem
          icon="bi-house-door"
          label="Home"
          onClick={() => handleNav("/profile")}
        />

        {user && (
          <>
            <DrawerItem
              icon="bi-person"
              label="Your Profile"
              onClick={() => handleNav("/profile")}
            />
            <div className="my-2 border-t border-slate-200" />
          </>
        )}

        <div className="my-2 border-t border-slate-200" />
        <DrawerItem
          icon="bi-info-circle"
          label="How it works"
          onClick={() => {
            if (closeDrawer) closeDrawer();
            openModal("about");
          }}
        />

        {(deferredPrompt || isIOS) && (
          <DrawerItem
            icon="bi-download"
            label="Install"
            onClick={() => {
              if (deferredPrompt) install();
              else if (isIOS) {
                if (closeDrawer) closeDrawer();
                openModal("installPwa");
              }
            }}
          />
        )}

        <div className="my-2 border-t border-slate-200" />

        <DrawerItem
          icon="bi-headphones"
          label="Listen"
          onClick={() => {
            if (closeDrawer) closeDrawer();
            openModal("listen");
          }}
        />
        <DrawerItem
          icon="bi-rocket-takeoff"
          label="Internships"
          onClick={() => {
            if (closeDrawer) closeDrawer();
            openModal("joinTeam");
          }}
        />
        <DrawerItem
          icon="bi-chat-square-dots"
          label="Feedback"
          onClick={() => {
            if (closeDrawer) closeDrawer();
            window.open("https://forms.gle/EA1DcFzigrmjRqZK8", "_blank");
          }}
        />

        <div className="my-2 border-t border-slate-200" />

        {user ? (
          <DrawerItem
            icon="bi-box-arrow-right"
            label="Log Out"
            variant="danger"
            onClick={() => {
              if (closeDrawer) closeDrawer();
              openModal("signOut");
            }}
          />
        ) : (
          <DrawerItem
            icon="bi-box-arrow-in-left"
            label="Sign In"
            onClick={() => {
              if (closeDrawer) closeDrawer();
              openModal("signin");
            }}
          />
        )}
      </div>

      {/* sticky footer for social links */}
      <div className="mt-auto px-6 py-6 backdrop-blur-sm">
        <SocialLinksRow />
      </div>
    </div>
  );
};
