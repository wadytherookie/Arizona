export function themeTones(hex: string) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) hex = "#137c72";
  const rgb = hex
      .slice(1)
      .match(/../g)!
      .map((x) => parseInt(x, 16) / 255),
    max = Math.max(...rgb),
    min = Math.min(...rgb),
    delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === rgb[0]) hue = ((rgb[1] - rgb[2]) / delta) % 6;
    else if (max === rgb[1]) hue = (rgb[2] - rgb[0]) / delta + 2;
    else hue = (rgb[0] - rgb[1]) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  const lightness = (max + min) / 2,
    saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  const sat = Math.min(70, saturation * 100);
  return {
    light: `hsl(${hue} ${sat}% 23%)`,
    dark: `hsl(${hue} ${sat * 0.7}% 80%)`,
  };
}
