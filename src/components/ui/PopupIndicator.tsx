import { createPortal } from "react-dom";
import { useState, useLayoutEffect, useRef, useEffect } from "react";

// define a generic margin for safety from screen edges
const SCREEN_MARGIN = 16;

interface PopupProps {
  text: string;
  triggerRef: React.RefObject<HTMLElement | null>;
  onClick?: () => void; // capture original button logic
}

export const PopupIndicator = ({ text, triggerRef, onClick }: PopupProps) => {
  const [visible, setVisible] = useState(false);

  // separate refs for the entire portal container and the bubble itself
  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // keep isHovering synchronous in a ref for timer callbacks
  const isHovering = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Manage Listeners and Timers (Lifecycle)
   */
  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;

    const handleEnter = () => {
      isHovering.current = true;
      setVisible(true);
    };

    const handleLeave = () => {
      isHovering.current = false;
      if (!timerRef.current) setVisible(false); // hide immediately if no click active
    };

    const handleClick = () => {
      if (onClick) onClick(); // fire original button logic

      // reset existing timer
      if (timerRef.current) clearTimeout(timerRef.current);
      setVisible(true);

      // start persistence window
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        // only hide if user has also stopped hovering
        if (!isHovering.current) setVisible(false);
      }, 1500);
    };

    el.addEventListener("mouseenter", handleEnter);
    el.addEventListener("mouseleave", handleLeave);
    el.addEventListener("click", handleClick);

    // cleanup
    return () => {
      el.removeEventListener("mouseenter", handleEnter);
      el.removeEventListener("mouseleave", handleLeave);
      el.removeEventListener("click", handleClick);
      if (timerRef.current) clearTimeout(timerRef.current);
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

      // A. Position the container center above the trigger point
      container.style.position = "absolute";
      container.style.top = `${rect.top + window.scrollY - 6}px`;
      container.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
      container.style.transform = "translate(-50%, -100%)";

      // B. Collision Handling Logic for the Body
      const bubbleRect = bubble.getBoundingClientRect();
      const bubbleHalfWidth = bubbleRect.width / 2;
      const viewportWidth = window.innerWidth;

      // where the bubble *wants* to be (left edge relative to viewport)
      const idealLeft = rect.left + rect.width / 2 - bubbleHalfWidth;
      const idealRight = idealLeft + bubbleRect.width;

      let xOffset = 0; // how much we need to shift the rectangle left or right

      // check if clipped on the left
      if (idealLeft < SCREEN_MARGIN) {
        xOffset = SCREEN_MARGIN - idealLeft;
      }

      // check if clipped on the right (priority if both)
      if (idealRight > viewportWidth - SCREEN_MARGIN) {
        xOffset = viewportWidth - SCREEN_MARGIN - idealRight;
      }

      // C. apply shift to the rectangular bubble (while arrow stays centered in container)
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
  }, [visible, triggerRef]);

  if (!visible) return null;

  return createPortal(
    /* main positioning container centered above trigger */
    <div
      ref={containerRef}
      className="z-9999 pointer-events-none origin-bottom group"
    >
      {/* the rectangular bubble that slides horizontally */}
      <div
        ref={bubbleRef}
        className="relative bg-slate-900 text-white text-[11px] font-medium py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap animate-in fade-in zoom-in slide-in-from-bottom-1 duration-150 origin-bottom"
        style={{ willChange: "transform" }} // hint to browser for smooth shifting
      >
        {text}
      </div>

      {/* the arrow is decoupled: always centered within the main container */}
      {/* and thus always centered over the triggerRef center point */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
    </div>,
    document.body,
  );
};
