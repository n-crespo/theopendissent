import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Post } from "../types";
import { useShare } from "../hooks/useShare";

interface ActionMenuProps {
  post: Post;
  isOwner: boolean;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const ActionMenu = ({
  post,
  isOwner,
  onEdit,
  onDelete,
}: ActionMenuProps) => {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [openUpward, setOpenUpward] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);

  // Use the hook
  const { sharePost } = useShare();

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!show && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;

      setOpenUpward(spaceBelow < 220);
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
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

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShow(false);
    sharePost(post);
  };

  const menuContent = (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        top: openUpward ? coords.top - 8 : coords.top + 32 + 8,
        left: coords.left + coords.width,
        transform: `translateX(-100%) ${openUpward ? "translateY(-100%)" : ""}`,
        borderRadius: "var(--radius-modal)",
      }}
      className="z-9999 w-44 overflow-hidden border border-border-subtle bg-white py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="flex flex-col">
        {isOwner ? (
          <>
            <button
              onClick={(e) => {
                onEdit(e);
                setShow(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <i className="bi bi-pencil-square text-slate-400"></i>
              Edit Post
            </button>
            <button
              onClick={(e) => {
                onDelete(e);
                setShow(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium text-logo-red hover:bg-red-50 transition-colors"
            >
              <i className="bi bi-trash3 text-red-400"></i>
              Delete
            </button>
          </>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShow(false);
            }}
            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <i className="bi bi-flag text-slate-400"></i>
            Report
          </button>
        )}

        <div className="my-1.5 border-t border-slate-100" />

        <button
          onClick={handleShareClick}
          className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <i className="bi bi-share text-slate-400"></i>
          Share
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
      >
        <i className="bi bi-three-dots text-lg"></i>
      </button>

      {show && createPortal(menuContent, document.body)}
    </div>
  );
};
