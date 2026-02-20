import React, { useEffect, useLayoutEffect, useRef } from "react";
import {
  getInterpolatedColor,
  getGradientCSS,
  DEFAULT_STOPS,
  // VIVID_STOPS,
} from "../../color-utils";

interface LensSliderProps {
  value?: number;
  onChange: (val: number | undefined) => void;
  blur?: boolean;
  dim?: boolean;
  greyscale?: boolean;
  disabled?: boolean;
  thumb?: boolean;
  onDisabledInteraction?: () => void;
}

export const InteractionSlider = ({
  value,
  onChange,
  blur,
  dim,
  greyscale,
  disabled,
  thumb = true,
  onDisabledInteraction,
}: LensSliderProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

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
      }
    };
  }, []);

  const updateDOM = (val: number, isPressed: boolean) => {
    if (!thumbRef.current || !textRef.current) return;

    if (!state.current.hasValue) {
      // keep it hidden and centered until it receives a value
      thumbRef.current.style.opacity = "0";
      thumbRef.current.style.transform = `translate(-50%, -50%) scale(0.5)`;
      thumbRef.current.style.left = "50%";
      return;
    }

    thumbRef.current.style.opacity = "1";
    const percent = ((val + 3) / 6) * 100;
    const activeColor = getInterpolatedColor(val, DEFAULT_STOPS);

    thumbRef.current.style.left = `${percent}%`;
    thumbRef.current.style.backgroundColor = "white";
    textRef.current.style.background = activeColor;
    textRef.current.style.display = "block";

    const scale = isPressed ? 1.3 : 1;
    thumbRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;

    // format to integer to avoid showing decimals
    const intVal = Math.round(val);
    const displayVal =
      intVal === 0 ? "0" : intVal > 0 ? `+${intVal}` : `${intVal}`;

    if (textRef.current.textContent !== displayVal) {
      textRef.current.textContent = displayVal;
    }
  };

  // force initial DOM state before browser paints to completely avoid visual flashes
  useLayoutEffect(() => {
    updateDOM(state.current.currentValue, false);
  }, []);

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
  }, [value, disabled, thumb]);

  const handlePointer = (e: React.PointerEvent) => {
    if (disabled) {
      if (onDisabledInteraction) onDisabledInteraction();
      return;
    }
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

    // snap to nearest integer on release
    const finalVal = Math.round(state.current.targetValue);
    state.current.targetValue = finalVal;

    if (!state.current.rafId) runLerpLoop();

    updateDOM(state.current.currentValue, false);
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
      {/* eraser/lock button */}
      {disabled ? (
        <button
          onClick={() => {
            if (onDisabledInteraction) onDisabledInteraction();
          }}
          className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 text-slate-400 cursor-not-allowed opacity-50`}
        >
          <i className="bi bi-lock text-lg"></i>
        </button>
      ) : (
        <button
          onClick={handleReset}
          disabled={value === undefined}
          className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 active:scale-90 text-slate-400 ${
            value === undefined
              ? "cursor-not-allowed opacity-50"
              : "hover:text-(--disagree) hover:bg-red-50 bg-white"
          }`}
          title="Clear interaction"
        >
          <i className="bi bi-eraser text-lg"></i>
        </button>
      )}

      {/* gradient bar/track container */}
      <div
        ref={trackRef}
        onPointerDown={handlePointer}
        onPointerMove={(e) => state.current.isDragging && handlePointer(e)}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`relative flex-1 h-10 flex items-center touch-none transition-all duration-300 ${
          disabled ? "cursor-not-allowed" : "cursor-crosshair"
        }`}
      >
        {/* track background */}
        <div
          className={`absolute left-0 right-0 h-4 top-1/2 -translate-y-1/2 rounded-xl border border-black/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] transition-all duration-300 ${
            dim ? "opacity-40" : ""
          } ${blur ? "blur-xs opacity-80" : ""} ${
            greyscale ? "grayscale" : ""
          }`}
          style={{
            background: getGradientCSS(DEFAULT_STOPS),
            backgroundRepeat: "no-repeat",
            backgroundClip: "padding-box",
          }}
        />

        {/* thumb */}
        {thumb && (
          <div
            ref={thumbRef}
            className="absolute top-1/2 flex items-center justify-center pointer-events-none z-10"
            style={{
              transition:
                "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease",
              backgroundColor: "white",
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
