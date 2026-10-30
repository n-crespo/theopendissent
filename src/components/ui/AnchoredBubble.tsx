import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ToastType } from "../../lib/toast";

const SCREEN_MARGIN = 12;
const GAP = 8;
const VISIBLE_MS = 1600;

const ICONS: Record<ToastType, string> = {
  success: "bi-check-circle-fill text-[#b8cc84]",
  error: "bi-exclamation-circle-fill text-[#f2a3aa]",
  info: "bi-info-circle-fill text-[#8ec5e8]",
};

interface Flash {
  id: number;
  text: string;
  type: ToastType;
  /** resolved after render so the anchor can be an element that mounts late */
  getAnchor: () => HTMLElement | null;
}

/**
 * Small confirmation bubble ("Link copied") shown above the control that
 * triggered it.
 */
const Bubble = ({ flash, onDone }: { flash: Flash; onDone: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const update = () => {
      const anchor = flash.getAnchor();
      const bubble = ref.current;
      if (!anchor || !bubble) return;
      const r = anchor.getBoundingClientRect();
      const w = bubble.offsetWidth;
      const ideal = r.left + r.width / 2 - w / 2;
      const left = Math.min(
        Math.max(ideal, SCREEN_MARGIN),
        window.innerWidth - SCREEN_MARGIN - w,
      );
      setPos({ top: r.top - GAP - bubble.offsetHeight, left });
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const timeout = setTimeout(onDone, VISIBLE_MS);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flash.id]);

  return createPortal(
    <motion.div
      ref={ref}
      role="status"
      initial={{ opacity: 0, y: 4, scale: 0.95 }}
      animate={{ opacity: pos ? 1 : 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 3, transition: { duration: 0.15 } }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{ top: pos?.top ?? 0, left: pos?.left ?? 0 }}
      className="pointer-events-none fixed z-9999 flex items-center gap-1.5 whitespace-nowrap rounded-control bg-stone-900 px-3 py-1.5 text-2xs font-medium text-white shadow-xl"
    >
      <i className={`bi ${ICONS[flash.type]} text-xs leading-none`} />
      {flash.text}
    </motion.div>,
    document.body,
  );
};

/**
 * Per-component anchored confirmations. Render `bubble` anywhere in the tree
 * and call `flash(() => el, "Link copied")`.
 */
export const useAnchoredFlash = () => {
  const [current, setCurrent] = useState<Flash | null>(null);

  const flash = useCallback(
    (
      getAnchor: () => HTMLElement | null,
      text: string,
      type: ToastType = "success",
    ) => setCurrent({ id: Date.now(), text, type, getAnchor }),
    [],
  );

  const bubble = (
    <AnimatePresence>
      {current && (
        <Bubble
          key={current.id}
          flash={current}
          onDone={() =>
            setCurrent((c) => (c?.id === current.id ? null : c))
          }
        />
      )}
    </AnimatePresence>
  );

  return { flash, bubble };
};
