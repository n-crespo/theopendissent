import {
  useState,
  useRef,
  useEffect,
  ReactNode,
  createContext,
  useContext,
} from "react";
import { createPortal } from "react-dom";

// Create a Context to allow items to close the menu
const DropdownContext = createContext<{ close: () => void } | null>(null);

interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  width?: string;
}

export const DropdownMenu = ({
  trigger,
  children,
  align = "right",
  width = "w-44",
}: DropdownMenuProps) => {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    height: 0,
    width: 0,
  });
  const [openUpward, setOpenUpward] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!show && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 220);
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        height: rect.height,
        width: rect.width,
      });
    }
    setShow(!show);
  };

  useEffect(() => {
    const close = () => setShow(false);
    if (show) {
      window.addEventListener("scroll", close, true);
      window.addEventListener("resize", close);
      document.addEventListener("click", close);
    }
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("click", close);
    };
  }, [show]);

  const menuContent = (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        top: openUpward ? coords.top - 8 : coords.top + coords.height + 8,
        left: align === "right" ? coords.left + coords.width : coords.left,
        transform: `translateX(${align === "right" ? "-100%" : "0"}) ${
          openUpward ? "translateY(-100%)" : ""
        }`,
        borderRadius: "var(--radius-modal)",
      }}
      className={`z-9999 ${width} overflow-hidden border border-border-subtle bg-white py-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-100`}
    >
      {/* Provide the close function to children */}
      <DropdownContext.Provider value={{ close: () => setShow(false) }}>
        <div className="flex flex-col">{children}</div>
      </DropdownContext.Provider>
    </div>
  );

  return (
    <>
      <div
        ref={triggerRef}
        onClick={toggleMenu}
        className="inline-flex cursor-pointer"
      >
        {trigger}
      </div>
      {show && createPortal(menuContent, document.body)}
    </>
  );
};

// --- Helper Components ---

export const MenuItem = ({
  icon,
  label,
  onClick,
  variant = "default",
}: {
  icon?: string;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: "default" | "danger";
}) => {
  // Consume the context
  const context = useContext(DropdownContext);

  const handleClick = (e: React.MouseEvent) => {
    // Run the passed action (e.g. edit/delete)
    onClick(e);

    // Explicitly close the menu via context
    // This works even if onClick called e.stopPropagation()
    context?.close();
  };

  return (
    <button
      onClick={handleClick}
      className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium transition-colors
        ${
          variant === "danger"
            ? "text-logo-red hover:bg-red-50"
            : "text-slate-700 hover:bg-slate-50"
        }`}
    >
      {icon && (
        <i
          className={`bi ${icon} ${variant === "danger" ? "text-(--disagree)" : "text-slate-400"}`}
        ></i>
      )}
      {label}
    </button>
  );
};

export const MenuSeparator = () => (
  <div className="my-1.5 border-t border-slate-100" />
);
