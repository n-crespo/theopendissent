import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";

// the glyph's square sits right of its center, so shift it to center the square
export const SIGN_IN_ICON = "bi-box-arrow-in-right -translate-x-[0.156em]";

export interface NavItem {
  to: string;
  label: string;
  /** bootstrap icon name; the "-fill" variant marks the active item */
  icon: string;
  isActive: boolean;
  unread?: number;
}

/** Primary navigation, shared by the desktop rail and the phone tab bar. */
export const useNavItems = (): NavItem[] => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { pathname } = useLocation();

  const isOn = (...paths: string[]) =>
    paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  return [
    {
      to: "/",
      label: "Feed",
      icon: "bi-house-door",
      isActive: pathname === "/" || isOn("/share", "/post"),
    },
    ...(user
      ? [
          {
            to: "/notifications",
            label: "Alerts",
            icon: "bi-bell",
            isActive: isOn("/notifications"),
            unread: unreadCount,
          },
          {
            to: "/you",
            label: "You",
            icon: "bi-person",
            isActive: isOn("/you", "/profile", "/settings"),
          },
        ]
      : []),
    {
      to: "/about",
      label: "About",
      icon: "bi-info-circle",
      isActive: isOn("/about", "/privacy", "/terms"),
    },
  ];
};
