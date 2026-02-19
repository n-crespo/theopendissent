export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface ColorStop {
  value: number;
  color: RGB;
}

export const getInterpolatedColor = (
  value: number,
  stops: ColorStop[],
): string => {
  const sortedStops = [...stops].sort((a, b) => a.value - b.value);

  if (value <= sortedStops[0].value) {
    const { r, g, b } = sortedStops[0].color;
    return `rgb(${r}, ${g}, ${b})`;
  }
  if (value >= sortedStops[sortedStops.length - 1].value) {
    const { r, g, b } = sortedStops[sortedStops.length - 1].color;
    return `rgb(${r}, ${g}, ${b})`;
  }

  let i = 0;
  while (i < sortedStops.length - 1 && value > sortedStops[i + 1].value) {
    i++;
  }

  const startStop = sortedStops[i];
  const endStop = sortedStops[i + 1];
  const t = (value - startStop.value) / (endStop.value - startStop.value);

  const r = Math.round(
    startStop.color.r + (endStop.color.r - startStop.color.r) * t,
  );
  const g = Math.round(
    startStop.color.g + (endStop.color.g - startStop.color.g) * t,
  );
  const b = Math.round(
    startStop.color.b + (endStop.color.b - startStop.color.b) * t,
  );

  return `rgb(${r}, ${g}, ${b})`;
};

/** generates a css linear-gradient string from color stops */
export const getGradientCSS = (stops: ColorStop[]): string => {
  const sortedStops = [...stops].sort((a, b) => a.value - b.value);
  const min = sortedStops[0].value;
  const max = sortedStops[sortedStops.length - 1].value;
  const range = max - min;

  const firstColor = sortedStops[0].color;
  const lastColor = sortedStops[sortedStops.length - 1].color;

  const cssStops = sortedStops.map((stop) => {
    const percentage = ((stop.value - min) / range) * 100;
    const { r, g, b } = stop.color;
    return `rgb(${r}, ${g}, ${b}) ${percentage}%`;
  });

  // add hard stops at 2px and calc(100% - 2px) to prevent edge bleeding
  return `linear-gradient(to right,
    rgb(${firstColor.r}, ${firstColor.g}, ${firstColor.b}) 0%,
    rgb(${firstColor.r}, ${firstColor.g}, ${firstColor.b}) 2px,
    ${cssStops.join(", ")},
    rgb(${lastColor.r}, ${lastColor.g}, ${lastColor.b}) calc(100% - 2px),
    rgb(${lastColor.r}, ${lastColor.g}, ${lastColor.b}) 100%
  )`;
};

/** global dashboard configuration */
export const DASHBOARD_STOPS: ColorStop[] = [
  { value: -3, color: { r: 239, g: 68, b: 68 } },
  { value: 0, color: { r: 234, g: 179, b: 8 } },
  { value: 3, color: { r: 34, g: 197, b: 94 } },
];
