import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import { RoundActionButton } from "../ui/RoundActionButton";
import { UnreadBadge } from "../ui/UnreadBadge";
import { useNavItems } from "./useNavItems";

const tabClass =
  "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-2xs font-semibold";

/**
 * Phone navigation, plus the floating post button. onCompose takes signed out
 * users to the sign in modal.
 */
export const BottomTabs = ({ onCompose }: { onCompose: () => void }) => {
  const { user } = useAuth();
  const { openModal } = useModal();
  const items = useNavItems();

  return (
    <>
      <div className="fixed right-4 bottom-[calc(var(--tabbar-h)+1rem)] z-50 rail:hidden">
        <RoundActionButton
          icon="bi-plus-lg"
          label="New post"
          onClick={onCompose}
          className="h-14 w-14 shadow-lg"
        />
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-50 flex h-(--tabbar-h) border-t border-stone-200 bg-logo-offwhite pb-[env(safe-area-inset-bottom)] rail:hidden"
      >
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            aria-current={item.isActive ? "page" : undefined}
            className={`${tabClass} ${item.isActive ? "text-logo-blue" : "text-stone-500"}`}
          >
            <span className="relative">
              <i
                className={`bi ${item.icon}${item.isActive ? "-fill" : ""} text-xl leading-none`}
              ></i>
              <UnreadBadge
                count={item.unread ?? 0}
                className="-top-1 -right-3"
              />
            </span>
            {item.label}
          </Link>
        ))}

        {!user && (
          <button
            onClick={() => openModal("signin")}
            className={`${tabClass} text-stone-500`}
          >
            <i className="bi bi-person text-xl leading-none"></i>
            Sign in
          </button>
        )}
      </nav>
    </>
  );
};
