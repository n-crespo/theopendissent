import { STANCE_VALUES } from "../../utils";

interface StanceMeterProps {
  score: number;
  color: string;
}

/** A row of ticks from -3 to +3, filled outward from the taller neutral tick. */
export const StanceMeter = ({ score, color }: StanceMeterProps) => (
  <span aria-hidden="true" className="flex items-center gap-x-0.5">
    {STANCE_VALUES.map((value) => {
      const isFilled =
        score === 0
          ? value === 0
          : score > 0
            ? value > 0 && value <= score
            : value < 0 && value >= score;

      return (
        <span
          key={value}
          style={isFilled ? { backgroundColor: color } : undefined}
          className={`w-1 rounded-full ${value === 0 ? "h-4" : "h-3"} ${
            isFilled ? "" : "bg-stone-200"
          }`}
        ></span>
      );
    })}
  </span>
);
