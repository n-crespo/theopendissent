import { useState, useEffect } from "react";

interface InteractionSliderProps {
  value?: number; // Current score (-5 to 5). Undefined = No interaction yet.
  onChange: (val: number) => void;
  disabled?: boolean;
}

export const InteractionSlider = ({
  value,
  onChange,
  disabled,
}: InteractionSliderProps) => {
  // If value is undefined (no interaction), default visual to 0 (middle)
  const [localValue, setLocalValue] = useState(value ?? 0);
  const [isDragging, setIsDragging] = useState(false);

  // Sync with external value updates (unless user is currently dragging)
  useEffect(() => {
    if (!isDragging && value !== undefined) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseInt(e.target.value, 10);
    setLocalValue(newVal);
    onChange(newVal);
  };

  // Calculate percentage for positioning the floating label (0% to 100%)
  // Range is -5 to 5 (total 10 steps)
  const percent = ((localValue + 5) / 10) * 100;

  // Dynamic color for the label
  const getLabelColor = (val: number) => {
    if (val === 0) return "bg-yellow-500";
    if (val > 0) return "bg-green-600";
    return "bg-red-600";
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full h-12 ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {/* The Track (Gradient) */}
      <div className="absolute w-full h-2 rounded-full bg-linear-to-r from-red-500 via-yellow-400 to-green-500 opacity-40"></div>

      {/* The Hidden Range Input */}
      <input
        type="range"
        min="-5"
        max="5"
        step="1"
        value={localValue}
        disabled={disabled}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchEnd={() => setIsDragging(false)}
        onChange={handleChange}
        className="
          w-full h-8 bg-transparent appearance-none cursor-pointer z-10
          focus:outline-none

          /* Webkit Thumb (Chrome/Safari) */
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-6
          [&::-webkit-slider-thumb]:h-6
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-white
          [&::-webkit-slider-thumb]:border-2
          [&::-webkit-slider-thumb]:border-slate-200
          [&::-webkit-slider-thumb]:shadow-[0_2px_4px_rgba(0,0,0,0.2)]
          [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:active:scale-110
          [&::-webkit-slider-thumb]:-mt-2 /* Aligns thumb with track vertically */

          /* Firefox Thumb */
          [&::-moz-range-thumb]:w-6
          [&::-moz-range-thumb]:h-6
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-white
          [&::-moz-range-thumb]:border-2
          [&::-moz-range-thumb]:border-slate-200
          [&::-moz-range-thumb]:shadow-sm
          [&::-moz-range-thumb]:transition-transform
          [&::-moz-range-thumb]:active:scale-110

          /* Runnable Track (needed for vertical alignment on some browsers) */
          [&::-webkit-slider-runnable-track]:h-2
          [&::-webkit-slider-runnable-track]:bg-transparent
        "
      />

      {/* Floating Value Label */}
      {/* We only show this if the user has interacted (value is defined) OR is dragging */}
      {(value !== undefined || isDragging) && (
        <div
          className={`absolute -top-1.25 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm pointer-events-none transition-all duration-75 ${getLabelColor(
            localValue,
          )}`}
          style={{
            // Clamped to prevent overflowing the edges
            left: `clamp(10px, ${percent}%, calc(100% - 25px))`,
            transform: `translateX(-50%)`,
          }}
        >
          {localValue > 0 ? `+${localValue}` : localValue}
        </div>
      )}
    </div>
  );
};
