import { useState, useRef, useEffect } from "react";

interface ActionMenuProps {
  isOwner: boolean;
  /** Pass the event to allow stopPropagation in handlers */
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onShare?: (e: React.MouseEvent) => void;
  onReport?: (e: React.MouseEvent) => void;
}

export const ActionMenu = ({
  isOwner,
  onEdit,
  onDelete,
  onShare = () => {},
  onReport = () => {},
}: ActionMenuProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = (
    e: React.MouseEvent,
    action: (e: React.MouseEvent) => void,
  ) => {
    // we call the action directly since the hook handlers handle stopPropagation
    action(e);
    setShowMenu(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-50 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
      >
        <i className="bi bi-three-dots text-lg"></i>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-border-subtle shadow-lg rounded-(--radius-input) py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          {isOwner && (
            <>
              <button
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium"
                onClick={(e) => handleAction(e, onEdit)}
              >
                <i className="bi bi-pencil-square opacity-70"></i> Edit
              </button>

              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 font-medium"
                onClick={(e) => handleAction(e, onDelete)}
              >
                <i className="bi bi-trash opacity-70"></i> Delete
              </button>
              <div className="h-px bg-slate-100 my-1 mx-2" />
            </>
          )}
          <button
            className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2.5 font-medium"
            onClick={(e) => handleAction(e, onShare)}
          >
            <i className="bi bi-box-arrow-up opacity-70"></i> Share
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 flex items-center gap-2.5 font-medium"
            onClick={(e) => handleAction(e, onReport)}
          >
            <i className="bi bi-flag opacity-70"></i> Report
          </button>
        </div>
      )}
    </div>
  );
};
