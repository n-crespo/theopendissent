import React, { useEffect, useLayoutEffect, useRef } from "react";
import {
  getInterpolatedColor,
  getGradientCSS,
  DEFAULT_STOPS,
} from "../../color-utils";
import { useModal } from "../../context/ModalContext";
import { PopupIndicator } from "./PopupIndicator";

interface LensSliderProps {
  value?: number;
  onChange: (val: number | undefined) => void;
  authored: boolean;
  isReply: boolean;
  loggedIn: boolean;
  onDisabledInteraction?: () => void;
}

export const InteractionSlider = ({
  value,
  onChange,
  authored,
  isReply,
  loggedIn,
  onDisabledInteraction,
}: LensSliderProps) => {
  const { openModal } = useModal();
  const btnRef = useRef<HTMLButtonElement>(null);

  const trackRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  // Deriving the internal states to match previous logic
  const isDisabled = isReply || authored || !loggedIn;
  const isDimmed = isReply || authored;
  const isBlurred = !loggedIn || (!isReply && authored);
  const showThumb = loggedIn && ((authored && isReply) || !authored);

  const state = useRef({
    currentValue: 0, // Starts at 0 so it smoothly slides out on initial load
    targetValue: value ?? 0,
    isDragging: false,
    hasValue: value !== undefined,
    rafId: 0,
  });

  // cleanup animation on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (state.current.rafId) {
        cancelAnimationFrame(state.current.rafId);
        state.current.rafId = 0;
      }
    };
  }, []);

  const updateDOM = (val: number, isPressed: boolean) => {
    if (!thumbRef.current || !textRef.current) return;

    if (!state.current.hasValue) {
      // keep it hidden and centered until it receives a value
      thumbRef.current.style.opacity = "0";
      thumbRef.current.style.transform = `translate(-50%, -50%) scale(0.5)`;
      return;
    }

    // fallback guard against math poisoning
    const safeVal = isNaN(val) ? 0 : val;

    thumbRef.current.style.opacity = "1";
    const percent = ((safeVal + 3) / 6) * 100;
    const activeColor = getInterpolatedColor(safeVal, DEFAULT_STOPS);

    thumbRef.current.style.left = `${percent}%`;
    // thumbRef.current.style.backgroundColor = "white";
    textRef.current.style.background = activeColor;
    textRef.current.style.display = "block";

    const scale = isPressed ? 1.3 : 1;
    thumbRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;

    const intVal = Math.round(safeVal);
    const displayVal =
      intVal === 0 ? "0" : intVal > 0 ? `+${intVal}` : `${intVal}`;

    if (textRef.current.textContent !== displayVal) {
      textRef.current.textContent = displayVal;
    }
  };

  useLayoutEffect(() => {
    updateDOM(state.current.currentValue, false);
  }, []);

  const runLerpLoop = () => {
    const s = state.current;

    // Fail-safe against NaN poisoning freezing the slider
    if (isNaN(s.currentValue)) s.currentValue = 0;
    if (isNaN(s.targetValue)) s.targetValue = 0;

    const lerpFactor = s.isDragging ? 0.4 : 0.15;
    const diff = s.targetValue - s.currentValue;

    if (Math.abs(diff) < 0.005) {
      s.currentValue = s.targetValue;
      updateDOM(s.currentValue, s.isDragging);
      s.rafId = 0;
      return;
    }

    s.currentValue += diff * lerpFactor;
    updateDOM(s.currentValue, s.isDragging);
    s.rafId = requestAnimationFrame(runLerpLoop);
  };

  useEffect(() => {
    state.current.hasValue = value !== undefined;
    if (value !== undefined) {
      state.current.targetValue = value;
      if (!state.current.isDragging && !state.current.rafId) runLerpLoop();
    } else {
      updateDOM(state.current.currentValue, false);
    }
  }, [value, isDisabled, showThumb]);

  const handlePointer = (e: React.PointerEvent) => {
    if (isDisabled) {
      if (onDisabledInteraction) onDisabledInteraction();
      return;
    }
    if (e.type === "pointerdown") {
      state.current.isDragging = true;
      state.current.hasValue = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const rect = trackRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0) {
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      let newValue = (x / rect.width) * 6 - 3;
      const snapThreshold = 0.15;
      if (Math.abs(newValue) < snapThreshold) newValue = 0;

      state.current.targetValue = isNaN(newValue) ? 0 : newValue;
      if (!state.current.rafId) runLerpLoop();
    }
  };

  const onPointerUp = () => {
    if (isDisabled) return;
    state.current.isDragging = false;

    const finalVal = Math.round(state.current.targetValue);
    state.current.targetValue = finalVal;

    if (!state.current.rafId) runLerpLoop();

    updateDOM(state.current.currentValue, false);
    onChange(finalVal);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    state.current.currentValue = 0;
    state.current.hasValue = false;
    if (state.current.rafId) {
      cancelAnimationFrame(state.current.rafId);
      state.current.rafId = 0;
    }

    // state.current.currentValue = 0;
    state.current.targetValue = 0;

    updateDOM(0, false);
    onChange(undefined);
  };

  const renderActionButton = () => {
    const baseStyles =
      "flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 active:scale-90 text-slate-400";
    const disabledStyles = "opacity-50 cursor-not-allowed";

    // user is not logged in
    if (!loggedIn) {
      return (
        <button
          className={`${baseStyles} opacity-50`}
          onClick={() => openModal("about")}
        >
          <i className="bi bi-lock text-lg"></i>
        </button>
      );
    }

    // this is under a reply
    if (isReply) {
      const msg = `${authorName} stance: ${value}`;
      return (
        <button ref={btnRef} className={`${baseStyles}`}>
          <i className="bi bi-question-lg text-lg"></i>
          <PopupIndicator
            text={msg}
            triggerRef={btnRef}
            onClick={() => console.log(msg)}
          />
        </button>
      );
    }

    // the user made this post, they can't rate it
    if (authored) {
      const msg = "You can't rate your own posts!";
      return (
        <button ref={btnRef} className={`${baseStyles} ${disabledStyles}`}>
          <i className="bi bi-lock text-lg"></i>
          <PopupIndicator
            text={msg}
            triggerRef={btnRef}
            onClick={() => console.log(msg)}
          />
        </button>
      );
    }

    // a rating has been selected
    if (value !== undefined) {
      return (
        <button
          onClick={handleReset}
          className={`${baseStyles} hover:text-(--disagree) hover:bg-red-50`}
          title="Clear interaction"
        >
          <i className="bi bi-eraser text-lg"></i>
        </button>
      );
    }

    // default case (show help)
    return (
      <button
        onClick={() => openModal("about")}
        className={`${baseStyles} hover:bg-slate-50 hover:text-logo-blue`}
        title="What is this?"
      >
        <i className="bi bi-question-lg text-lg"></i>
      </button>
    );
  };

  const authorName = authored ? "Your" : "Author's";
  return (
    <div className="flex items-center w-full h-8 select-none gap-4">
      {renderActionButton()}

      {/* gradient bar/track container */}
      <div
        ref={trackRef}
        onPointerDown={handlePointer}
        onPointerMove={(e) => state.current.isDragging && handlePointer(e)}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`relative flex-1 h-10 flex items-center touch-none transition-all duration-300 mx-2 ${
          isDisabled ? "cursor-not-allowed" : "cursor-crosshair"
        }`}
      >
        <div
          ref={sliderRef}
          className={`absolute left-0 right-0 h-4 top-1/2 -translate-y-1/2 rounded-xl border border-black/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] transition-all duration-300 ${
            isDimmed ? "opacity-40" : ""
          } ${isBlurred ? "blur-xs opacity-80" : ""}`}
          style={{
            background: getGradientCSS(DEFAULT_STOPS),
            backgroundRepeat: "no-repeat",
            backgroundClip: "padding-box",
          }}
        />

        {(isReply || authored) && (
          <PopupIndicator
            triggerRef={trackRef}
            text={
              isReply
                ? `${authorName} stance: ${value}`
                : authored
                  ? "You can't rate your own post!"
                  : ""
            }
          />
        )}

        {showThumb && (
          <div
            ref={thumbRef}
            className="absolute top-1/2 flex items-center justify-center pointer-events-none z-10"
            style={{
              transition:
                "transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.1s ease, opacity 0.1s ease, box-shadow 0.1s ease",
            }}
          >
            <span
              ref={textRef}
              className="text-sm leading-none bold border border-white w-auto px-2 py-2 box-content rounded-xl overflow-hidden text-white font-bold"
            >
              0
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
