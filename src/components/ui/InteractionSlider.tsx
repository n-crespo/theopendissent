import React, { useEffect, useRef } from "react";

const COLORS = {
  red: { r: 239, g: 68, b: 68 },
  yellow: { r: 234, g: 179, b: 8 },
  green: { r: 34, g: 197, b: 94 },
};

const getThumbColor = (val: number) => {
  const { red, yellow, green } = COLORS;
  let r, g, b;
  if (val <= 0) {
    const t = (val + 5) / 5;
    r = red.r + (yellow.r - red.r) * t;
    g = red.g + (yellow.g - red.g) * t;
    b = red.b + (yellow.b - red.b) * t;
  } else {
    const t = val / 5;
    r = yellow.r + (green.r - yellow.r) * t;
    g = yellow.g + (green.g - yellow.g) * t;
    b = yellow.b + (green.b - yellow.b) * t;
  }
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
};

interface LensSliderProps {
  value?: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export const InteractionSlider = ({
  value = 0,
  onChange,
  disabled,
}: LensSliderProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const state = useRef({
    currentValue: value,
    targetValue: value,
    isDragging: false,
    rafId: 0,
  });

  const updateDOM = (val: number, isPressed: boolean) => {
    if (!thumbRef.current || !textRef.current) return;

    const percent = ((val + 5) / 10) * 100;
    const activeColor = getThumbColor(val);

    thumbRef.current.style.left = `${percent}%`;
    const scale = isPressed ? 1.4 : 1;
    thumbRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
    thumbRef.current.style.borderWidth = isPressed ? "2px" : "4px";
    thumbRef.current.style.borderColor = activeColor;

    const displayVal =
      val === 0 ? "0.0" : val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
    if (textRef.current.textContent !== displayVal) {
      textRef.current.textContent = displayVal;
    }
  };

  const runLerpLoop = () => {
    const s = state.current;

    // dynamic speed: 0.06 for the slow tap jump, 0.25 for responsive dragging
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
    if (!state.current.isDragging) {
      state.current.targetValue = value;
      if (!state.current.rafId) runLerpLoop();
    }
  }, [value]);

  const handlePointer = (e: React.PointerEvent) => {
    if (disabled) return;

    if (e.type === "pointerdown") {
      state.current.isDragging = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    const rect = trackRef.current?.getBoundingClientRect();
    if (rect) {
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      let newValue = (x / rect.width) * 10 - 5;

      const snapThreshold = 0.15;
      if (Math.abs(newValue) < snapThreshold) newValue = 0;

      state.current.targetValue = newValue;

      // start or keep the loop running
      if (!state.current.rafId) runLerpLoop();
    }
  };

  const onPointerUp = () => {
    state.current.isDragging = false;
    onChange(state.current.targetValue);
  };

  return (
    <div className="flex items-center justify-center w-full h-10 select-none">
      <div
        ref={trackRef}
        onPointerDown={handlePointer}
        onPointerMove={(e) => state.current.isDragging && handlePointer(e)}
        onPointerUp={onPointerUp}
        className={`relative w-full max-w-md h-3.5 rounded-full cursor-crosshair touch-none border border-black/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] ${
          disabled ? "opacity-40 grayscale" : ""
        }`}
        style={{
          background: "linear-gradient(to right, #ef4444, #eab308, #22c55e)",
        }}
      >
        <div
          ref={thumbRef}
          className="absolute top-1/2 w-11 h-11 rounded-full bg-white/30 flex items-center justify-center pointer-events-none backdrop-blur-[3px]"
          style={{
            left: "50%",
            transform: "translate(-50%, -50%) scale(1)",
            transition:
              "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), border-width 0.2s ease, border-color 0.1s ease",
            filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.25))",
            borderStyle: "solid",
          }}
        >
          <span
            ref={textRef}
            className="text-[13px] font-bold tracking-wider text-black leading-none"
          >
            0.0
          </span>
        </div>
      </div>
    </div>
  );
};
