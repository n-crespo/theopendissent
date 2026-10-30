import { DEFAULT_STOPS, getInterpolatedColor } from "../../color-utils";
import { STANCE_VALUES } from "../../utils";

interface StanceMeterProps {
  score: number;
}

/** A small band of the stance scale from -3 to +3, with the score lifted out. */
export const StanceMeter = ({ score }: StanceMeterProps) => (
  <span aria-hidden="true" className="flex items-center">
    {STANCE_VALUES.map((value) => (
      <span
        key={value}
        style={{ backgroundColor: getInterpolatedColor(value, DEFAULT_STOPS) }}
        className={
          value === score
            ? "relative z-10 h-4.5 w-3.25 rounded-sm shadow-[0_0_0_2px_white]"
            : "h-2.5 w-2.75 first:rounded-l-sm last:rounded-r-sm"
        }
      ></span>
    ))}
  </span>
);
