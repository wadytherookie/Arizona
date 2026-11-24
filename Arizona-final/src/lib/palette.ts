export type ThemeMode = "light" | "dark" | "system";
export type AppearanceSettings = {
  color: string;
  mode: ThemeMode;
  coverage: number;
};
export const appearanceKey = "arizona-appearance-v2";
export const validColor = (value: unknown): value is string =>
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
function rgb(hex: string) {
  return hex
    .slice(1)
    .match(/../g)!
    .map((x) => parseInt(x, 16) / 255);
}
function hueSaturation(hex: string) {
  const [r, g, b] = rgb(hex),
    max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min,
    l = (max + min) / 2;
  let h = 0;
  if (d) {
    h =
      max === r
        ? ((g - b) / d) % 6
        : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: d ? d / (1 - Math.abs(2 * l - 1)) : 0 };
}
export function contrast(a: string, b: string) {
  const luminance = (v: string) => {
    const c = rgb(v).map((x) =>
      x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4,
    );
    return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
  };
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function hsl(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l),
    f = (n: number) => {
      const k = (n + h / 30) % 12;
      return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
        .toString(16)
        .padStart(2, "0");
    };
  return "#" + f(0) + f(8) + f(4);
}
export function palette(
  color: string,
  coverage = 100,
  dark = false,
): Record<string, string> {
  if (!validColor(color)) color = "#f35ca6";
  const { h, s } = hueSaturation(color),
    c = Math.min(100, Math.max(0, coverage)) / 100,
    sat = Math.min(88, s * 100),
    bg = hsl(h, sat * c, dark ? 11 : 96 - 8 * c),
    surface = hsl(h, sat * 0.8 * c, dark ? 17 : 99 - 5 * c);
  let strong = hsl(h, sat, dark ? 81 : 40);
  for (let l = 39; !dark && contrast(strong, bg) < 5 && l >= 8; l--)
    strong = hsl(h, sat, l);
  return {
    "--accent": color,
    "--bg": bg,
    "--surface": surface,
    "--ink": hsl(h, sat * 0.38, dark ? 96 : 16),
    "--muted": hsl(h, sat * 0.22, dark ? 79 : 30),
    "--line": hsl(h, sat * 0.35 * c, dark ? 34 : 82 - 7 * c),
    "--tint": hsl(h, sat * 0.8 * c, dark ? 22 : 96 - 11 * c),
    "--soft": hsl(h, sat * 0.72 * c, dark ? 26 : 94 - 13 * c),
    "--strong": strong,
  };
}
