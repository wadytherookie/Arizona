import { json } from "./http";
import { distance, closest } from "../normalize";
export async function suggestions(q: string) {
  const lookup = async (term: string) => {
    const d = await json(
      "https://clinicaltables.nlm.nih.gov/api/conditions/v3/search?" +
        new URLSearchParams({ terms: term, maxList: "50", df: "primary_name" }),
    );
    return [
      ...new Set<string>(
        (d?.[3] ?? [])
          .map((x: unknown[]) => String(x?.[0] ?? ""))
          .filter(Boolean),
      ),
    ];
  };
  let names = await lookup(q),
    fuzzy = !names.length;
  if (fuzzy && q.length >= 4) names = await lookup(q.slice(0, 4));
  const candidates = [...new Set([...names, ...closest(q)])];
  const rank = (s: string) =>
    s.toLowerCase().startsWith(q.toLowerCase())
      ? -2
      : s.toLowerCase().includes(q.toLowerCase())
        ? -1
        : distance(q, s) / Math.max(q.length, s.length);
  return {
    suggestions: candidates.sort((a, b) => rank(a) - rank(b)).slice(0, 8),
    fuzzy,
  };
}
