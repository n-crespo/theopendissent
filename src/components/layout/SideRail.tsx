import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import { RoundActionButton } from "../ui/RoundActionButton";
import { UnreadBadge } from "../ui/UnreadBadge";
import { useNavItems } from "./useNavItems";

/** Desktop navigation. Below the rail breakpoint BottomTabs takes over. */
export const SideRail = ({ onCompose }: { onCompose: () => void }) => {
  const { user } = useAuth();
  const { openModal } = useModal();
  const items = useNavItems();

  return (
    <nav
      aria-label="Main"
      className="sticky top-0 hidden h-screen w-[84px] flex-col items-center gap-1.5 justify-self-end py-4 rail:flex"
    >
      <Link to="/" aria-label="Home" className="mb-2.5 rounded-control">
        <img
          src="/favicons/favicon.svg"
          alt=""
          width={36}
          height={36}
          className="h-9.5 w-9.5 rounded-control"
          draggable="false"
        />
      </Link>

      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          aria-current={item.isActive ? "page" : undefined}
          className={`relative flex w-17 flex-col items-center gap-0.5 rounded-control py-2 text-2xs font-semibold transition-colors ${
            item.isActive
              ? "text-logo-blue"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          <i
            className={`bi ${item.icon}${item.isActive ? "-fill" : ""} text-xl leading-none`}
          ></i>
          {item.label}
          <UnreadBadge count={item.unread ?? 0} className="top-1 right-3" />
        </Link>
      ))}

      <div className="mt-2.5">
        {user ? (
          <RoundActionButton
            icon="bi-plus-lg"
            label="New post"
            onClick={onCompose}
            className="h-14 w-14"
          />
        ) : (
          <RoundActionButton
            icon="bi-person"
            label="Sign in"
            onClick={() => openModal("signin")}
            className="h-14 w-14"
          />
        )}
      </div>
    </nav>
  );
};
