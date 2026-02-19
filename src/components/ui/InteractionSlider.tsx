import React, { useEffect, useRef } from "react";
import {
  getInterpolatedColor,
  getGradientCSS,
  DEFAULT_STOPS,
  VIVID_STOPS,
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
      thumbRef.current.style.opacity = "0"; // Set to 0 to keep it hidden until used
      thumbRef.current.style.transform = `translate(-50%, -50%) scale(0.5)`;
      return;
    }

    thumbRef.current.style.opacity = "1";
    const percent = ((val + 3) / 6) * 100;
    const activeColor = getInterpolatedColor(val, DEFAULT_STOPS);

    thumbRef.current.style.left = `${percent}%`;

    if (disabled) {
      lockRef.current.style.display = "block";
      textRef.current.style.display = "none";
      thumbRef.current.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
      thumbRef.current.style.boxShadow = "none";
    } else {
      lockRef.current.style.display = "none";
      textRef.current.style.display = "block";
      thumbRef.current.style.backgroundColor = "white";
      textRef.current.style.background = activeColor;
      // const glowIntensity = isPressed ? "15px" : "10px";
      // thumbRef.current.style.boxShadow = `0 4px 10px rgba(0,0,0,0.1), 0 0 ${glowIntensity} ${activeColor}`;
    }

    const scale = isPressed && !disabled ? 1.4 : 1;
    thumbRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;

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
      let newValue = (x / rect.width) * 6 - 3;
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
    <div className="flex items-center w-full h-8 select-none gap-4">
      {/* Eraser Button */}
      <button
        onClick={handleReset}
        disabled={disabled || !value}
        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 active:scale-90 text-slate-400 ${
          disabled || !value
            ? "cursor-not-allowed"
            : "hover:text-(--disagree) hover:bg-red-50 bg-white"
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
        className={`relative flex-1 h-4 rounded-full cursor-crosshair touch-none border border-black/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] transition-all duration-300 ${
          disabled ? "grayscale-[0.5] opacity-80" : ""
        }`}
        style={{
          background: getGradientCSS(DEFAULT_STOPS),
          backgroundRepeat: "no-repeat",
          backgroundClip: "padding-box",
        }}
      >
        <div
          ref={thumbRef}
          className="absolute top-1/2 flex items-center justify-center pointer-events-none z-10"
          style={{
            left: "50%",
            transform: "translate(-50%, -50%) scale(1)",
            transition:
              "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease",
            backgroundColor: "white",
          }}
        >
          <svg
            ref={lockRef}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 text-slate-600 hidden"
          >
            <path
              fillRule="evenodd"
              d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
              clipRule="evenodd"
            />
          </svg>
          <span
            ref={textRef}
            className="text-sm leading-none bold border border-white w-auto px-2 py-2 box-content rounded-xl overflow-hidden text-white font-bold"
          >
            Post
          </span>
        </div>
      </div>
    </div>
  );
};
