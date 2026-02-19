import React, { useEffect, useRef } from "react";
import {
  getInterpolatedColor,
  getGradientCSS,
  DASHBOARD_STOPS,
} from "../../color-utils";

interface LensSliderProps {
  value?: number;
  onChange: (val: number | undefined) => void;
  disabled?: boolean;
}

export const InteractionSlider = ({
  value,
  onChange,
  disabled,
}: LensSliderProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const lockRef = useRef<SVGSVGElement>(null);

  const state = useRef({
    currentValue: value ?? 0,
    targetValue: value ?? 0,
    isDragging: false,
    hasValue: value !== undefined,
    rafId: 0,
  });

  const updateDOM = (val: number, isPressed: boolean) => {
    if (!thumbRef.current || !textRef.current || !lockRef.current) return;

    if (!state.current.hasValue) {
      thumbRef.current.style.opacity = "0";
      thumbRef.current.style.transform = `translate(-50%, -50%) scale(0.5)`;
      return;
    }

    thumbRef.current.style.opacity = "1";
    const percent = ((val + 5) / 10) * 100;

    // dynamically determine color from utils
    const activeColor = getInterpolatedColor(val, DASHBOARD_STOPS);

    thumbRef.current.style.left = `${percent}%`;

    if (disabled) {
      lockRef.current.style.display = "block";
      textRef.current.style.display = "none";
      thumbRef.current.style.borderColor = "#94a3b8";
    } else {
      lockRef.current.style.display = "none";
      textRef.current.style.display = "block";
      thumbRef.current.style.borderColor = activeColor;
    }

    const scale = isPressed && !disabled ? 1.4 : 1;
    thumbRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
    thumbRef.current.style.borderWidth = isPressed ? "2px" : "4px";

    const displayVal =
      val === 0 ? "0.0" : val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
    if (textRef.current.textContent !== displayVal) {
      textRef.current.textContent = displayVal;
    }
  };

  const runLerpLoop = () => {
    const s = state.current;
    const lerpFactor = s.isDragging ? 0.25 : 0.06;
    const diff = s.targetValue - s.currentValue;

    if (Math.abs(diff) < 0.005) {
      s.currentValue = s.targetValue;
      updateDOM(s.currentValue, s.isDragging);
      s.rafId = 0;
      return;
    }

    s.currentValue += diff * lerpFactor;
    updateDOM(s.currentValue, true);
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
  }, [value, disabled]);

  const handlePointer = (e: React.PointerEvent) => {
    if (disabled) return;
    if (e.type === "pointerdown") {
      state.current.isDragging = true;
      state.current.hasValue = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const rect = trackRef.current?.getBoundingClientRect();
    if (rect) {
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      let newValue = (x / rect.width) * 10 - 5;
      const snapThreshold = 0.15;
      if (Math.abs(newValue) < snapThreshold) newValue = 0;
      state.current.targetValue = newValue;
      if (!state.current.rafId) runLerpLoop();
    }
  };

  const onPointerUp = () => {
    if (disabled) return;
    state.current.isDragging = false;
    updateDOM(state.current.currentValue, false);

    // round to one decimal place before emitting
    const finalVal = Math.round(state.current.targetValue * 10) / 10;
    onChange(finalVal);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    state.current.hasValue = false;
    cancelAnimationFrame(state.current.rafId);
    state.current.rafId = 0;
    updateDOM(0, false);
    onChange(undefined);
  };

  return (
    <div className="flex items-center w-full h-10 select-none gap-4">
      {/* Eraser Button */}
      <button
        onClick={handleReset}
        disabled={disabled || !value}
        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 active:scale-90 ${
          disabled || !value
            ? "text-slate-300 cursor-not-allowed opacity-50"
            : "text-slate-500 hover:text-(--disagree) hover:bg-red-50 bg-white"
        }`}
        title="Clear interaction"
      >
        <i className="bi bi-eraser text-lg"></i>
      </button>

      {/* gradient bar/track */}
      <div
        ref={trackRef}
        onPointerDown={handlePointer}
        onPointerMove={(e) => state.current.isDragging && handlePointer(e)}
        onPointerUp={onPointerUp}
        className={`relative flex-1 h-3 rounded-full cursor-crosshair touch-none border border-black/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] transition-all duration-300 ${
          disabled ? "grayscale-[0.5] opacity-80" : ""
        }`}
        style={{
          background: getGradientCSS(DASHBOARD_STOPS),
          backgroundRepeat: "no-repeat", // crucial to stop the "sliver" on the far edge
          backgroundClip: "padding-box", // keeps the paint inside the border
        }}
      >
        <div
          ref={thumbRef}
          className="absolute top-1/2 w-10 h-10 rounded-full bg-white/40 flex items-center justify-center pointer-events-none backdrop-blur-xs z-10"
          style={{
            left: "50%",
            transform: "translate(-50%, -50%) scale(1)",
            transition:
              "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), border-width 0.2s ease, border-color 0.1s ease, opacity 0.2s ease",
            filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.25))",
            borderStyle: "solid",
            opacity: 0,
          }}
        >
          <svg
            ref={lockRef}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 text-slate-500 hidden"
          >
            <path
              fillRule="evenodd"
              d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
              clipRule="evenodd"
            />
          </svg>
          <span
            ref={textRef}
            className="text-[13px] font-bold tracking-normal text-black leading-none"
          >
            0.0
          </span>
        </div>
      </div>
    </div>
  );
};
