import { createPortal } from "react-dom";
import { useState, useLayoutEffect, useRef, useEffect } from "react";

const SCREEN_MARGIN = 16;

interface PopupProps {
  text: string;
  triggerRef: React.RefObject<HTMLElement | null>;
  onClick?: () => void;
  yOffset?: number;
}

/**
 * Renders a portal-based tooltip that handles edge collisions and bundled interaction logic.
 */
export const PopupIndicator = ({
  text,
  triggerRef,
  onClick,
  yOffset = 10,
}: PopupProps) => {
  const [visible, setVisible] = useState(false);

  // separate refs for the entire portal container and the bubble itself
  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // keep isHovering synchronous in a ref for timer callbacks
  const isHovering = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const enterTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Manage Listeners and Timers (Lifecycle)
   */
  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;

    // only allow real mice to trigger the permanent "hover" state
    const handleEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      isHovering.current = true;

      enterTimerRef.current = setTimeout(() => {
        setVisible(true);
      }, 1000);
    };

    const handleLeave = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      isHovering.current = false;

      // Clear the pending show timer so it doesn't pop up after we've left
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);

      if (!timerRef.current) setVisible(false);
    };

    const handleClick = () => {
      if (onClick) onClick();

      // Clear any pending hover timer so the click takes priority
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);

      setVisible(true);

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (!isHovering.current) setVisible(false);
      }, 1000);
    };

    // pointerenter/leave are more robust for distinguishing touch vs mouse
    el.addEventListener("pointerenter", handleEnter as any);
    el.addEventListener("pointerleave", handleLeave as any);
    el.addEventListener("click", handleClick);

    // cleanup
    return () => {
      el.removeEventListener("pointerenter", handleEnter as any);
      el.removeEventListener("pointerleave", handleLeave as any);
      el.removeEventListener("click", handleClick);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    };
  }, [triggerRef, text, onClick]);

  /**
   * Handle Positioning and Horizontal Sliding
   */
  useLayoutEffect(() => {
    if (
      !visible ||
      !triggerRef.current ||
      !containerRef.current ||
      !bubbleRef.current
    )
      return;

    const updatePosition = () => {
      const el = triggerRef.current!;
      const container = containerRef.current!;
      const bubble = bubbleRef.current!;

      const rect = el.getBoundingClientRect();

      // place container centered above the trigger
      container.style.position = "absolute";
      // Use the yOffset prop here to create more clearance
      container.style.top = `${rect.top + window.scrollY - yOffset}px`;
      container.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
      container.style.transform = "translate(-50%, -100%)";

      // B. Collision Handling Logic for the Body
      const bubbleRect = bubble.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const idealLeft = rect.left + rect.width / 2 - bubbleRect.width / 2;
      const idealRight = idealLeft + bubbleRect.width;

      let xOffset = 0; // how much we need to shift the rectangle left or right

      // check if clipped on the left
      if (idealLeft < SCREEN_MARGIN) {
        xOffset = SCREEN_MARGIN - idealLeft;
      } else if (idealRight > viewportWidth - SCREEN_MARGIN) {
        xOffset = viewportWidth - SCREEN_MARGIN - idealRight;
      }

      // shift the rectangle bubble while the arrow stays centered in the container
      bubble.style.transform = `translateX(${xOffset}px)`;
    };

    // run immediately and listen for changes while visible
    updatePosition();
    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [visible, triggerRef, yOffset]);

  if (!visible) return null;

  return createPortal(
    /* main positioning container centered above trigger */
    <div
      ref={containerRef}
      className="z-9999 pointer-events-none origin-bottom"
    >
      {/* the rectangular bubble that slides horizontally */}
      <div
        ref={bubbleRef}
        className="relative bg-slate-900 text-white text-[11px] font-medium py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap animate-in fade-in zoom-in slide-in-from-bottom-1 duration-150 origin-bottom"
        style={{ willChange: "transform" }} // hint to browser for smooth shifting
      >
        {text}
      </div>
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
    </div>,
    document.body,
  );
};
