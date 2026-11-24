import { aliases, conditions } from "../config/arizona";
export const clean = (v: unknown) =>
  String(v ?? "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
export const canonical = (v: unknown) => {
  const s = clean(v).replace(/\btype\s*([12])\b/gi, "Type $1");
  return aliases[s.toLowerCase()] ?? s;
};
export function distance(a: string, b: string) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  let d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const n = [i];
    for (let j = 1; j <= b.length; j++)
      n[j] = Math.min(
        n[j - 1] + 1,
        d[j] + 1,
        d[j - 1] + Number(a[i - 1] !== b[j - 1]),
      );
    d = n;
  }
  return d[b.length];
}
export function closest(q: string) {
  return conditions
    .map((name) => ({
      name,
      score: name.toLowerCase().includes(q.toLowerCase())
        ? -1
        : distance(q, name),
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map((x) => x.name);
}
