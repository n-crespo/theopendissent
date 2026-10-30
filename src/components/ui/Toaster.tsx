import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast, ToastItem, ToastType } from "../../lib/toast";
import { useAuth } from "../../context/AuthContext";

const ICONS: Record<ToastType, string> = {
  success: "bi-check-circle-fill text-[#b8cc84]",
  error: "bi-exclamation-circle-fill text-[#f2a3aa]",
  info: "bi-info-circle-fill text-[#8ec5e8]",
};

const SWIPE_DISMISS_PX = 80;

/**
 * Bottom snackbar for async results, undo-style actions and errors that have
 * no form to live in. Form errors stay inline and quick confirmations use
 * AnchoredBubble instead.
 *
 * Placement never depends on the toast's own height: the toast is anchored
 * at a fixed offset above the tab bar (or the sign-in banner) and grows upward,
 * so long messages can't shove other UI around.
 */
export const Toaster = () => {
  const { user } = useAuth();
  const [item, setItem] = useState<ToastItem | null>(null);

  // remaining-time bookkeeping so hover/drag can pause the auto-dismiss
  const timer = useRef({
    handle: undefined as ReturnType<typeof setTimeout> | undefined,
    start: 0,
    remaining: 0,
    running: false,
  });

  useEffect(() => toast.subscribe(setItem), []);

  const pause = () => {
    const t = timer.current;
    if (!t.running) return;
    clearTimeout(t.handle);
    t.remaining -= Date.now() - t.start;
    t.running = false;
  };

  const resume = () => {
    const t = timer.current;
    if (!item || t.running || !Number.isFinite(item.duration)) return;
    const id = item.id;
    t.start = Date.now();
    t.running = true;
    t.handle = setTimeout(() => toast.dismiss(id), Math.max(t.remaining, 0));
  };

  useEffect(() => {
    if (!item) return;
    const t = timer.current;
    t.remaining = item.duration;
    t.running = false;
    resume();
    return () => {
      clearTimeout(t.handle);
      t.running = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  // signed in: sit above the phone tab bar. signed out: sit above the sign-in banner, whose height
  // UnauthenticatedFooter publishes as --signin-banner-h.
  const offset = user
    ? "bottom-[calc(var(--tabbar-h)+0.75rem)] rail:bottom-6"
    : "bottom-[calc(var(--signin-banner-h,0.75rem)+0.75rem)]";

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-0 z-90 flex justify-center px-3 ${offset}`}
    >
      <AnimatePresence mode="wait">
        {item && (
          <motion.div
            key={item.id}
            role={item.type === "error" ? "alert" : "status"}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ type: "spring", damping: 24, stiffness: 320 }}
            drag="x"
            dragSnapToOrigin
            dragElastic={0.6}
            onDragStart={pause}
            onDragEnd={(_, info) => {
              if (
                Math.abs(info.offset.x) > SWIPE_DISMISS_PX ||
                Math.abs(info.velocity.x) > 500
              ) {
                toast.dismiss(item.id);
              } else {
                resume();
              }
            }}
            onMouseEnter={pause}
            onMouseLeave={resume}
            className="pointer-events-auto flex w-full max-w-115 cursor-grab touch-pan-y items-center gap-3 rounded-card bg-stone-900 py-3 pl-4 pr-3 text-white shadow-2xl active:cursor-grabbing"
          >
            <i className={`bi ${ICONS[item.type]} shrink-0 text-lg leading-none`} />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold leading-snug">
                {item.title}
              </p>
              {item.description && (
                <p className="mt-0.5 line-clamp-3 text-[13px] leading-snug text-stone-300">
                  {item.description}
                </p>
              )}
            </div>
            {item.action && (
              <button
                onClick={() => {
                  const { onClick } = item.action!;
                  toast.dismiss(item.id);
                  onClick();
                }}
                className="shrink-0 rounded-control bg-white/12 px-3 py-1.5 text-[13px] font-bold transition-colors hover:bg-white/20"
              >
                {item.action.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
