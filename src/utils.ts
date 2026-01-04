/**
 * Shuffle an array in place
 */
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]; // create a copy to maintain immutability
  let currentIndex = newArray.length;

  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [newArray[currentIndex], newArray[randomIndex]] = [
      newArray[randomIndex],
      newArray[currentIndex],
    ];
  }
  return newArray;
}

/**
 * Converts a past Date object into a human-readable "time ago" string.
 * ex. "3 hours ago", "yesterday", "5 months ago".
 */
export function timeAgo(date: Date, locale: string = "en"): string {
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);

  const MINUTE = 60;
  const HOUR = MINUTE * 60;
  const DAY = HOUR * 24;
  const MONTH = DAY * 30;
  const YEAR = DAY * 365;

  type RelativeTimeUnit =
    | "second"
    | "minute"
    | "hour"
    | "day"
    | "month"
    | "year";

  let unit: RelativeTimeUnit;
  let value: number;

  // determine the largest relevant unit
  if (diffInSeconds < MINUTE) {
    unit = "second";
    value = diffInSeconds;
  } else if (diffInSeconds < HOUR) {
    unit = "minute";
    value = Math.floor(diffInSeconds / MINUTE);
  } else if (diffInSeconds < DAY) {
    unit = "hour";
    value = Math.floor(diffInSeconds / HOUR);
  } else if (diffInSeconds < MONTH) {
    unit = "day";
    value = Math.floor(diffInSeconds / DAY);
  } else if (diffInSeconds < YEAR) {
    unit = "month";
    value = Math.floor(diffInSeconds / MONTH);
  } else {
    unit = "year";
    value = Math.floor(diffInSeconds / YEAR);
  }

  // use Intl human-readable string
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  return rtf.format(0 - value, unit);
}

export const formatCompactNumber = (number: number) => {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(number);
};
