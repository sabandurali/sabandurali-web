/** WCAG 2.x contrast for #rrggbb colours (used by the design-token tests). */

export function parseHexColor(hex: string): [number, number, number] {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match?.[1]) throw new Error(`Not a #rrggbb colour: ${hex}`);
  const value = match[1];
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return [red, green, blue];
}

function channel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const [red, green, blue] = parseHexColor(hex);
  return (
    0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue)
  );
}

export function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [
    relativeLuminance(foreground),
    relativeLuminance(background),
  ].sort((a, b) => b - a);
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}
