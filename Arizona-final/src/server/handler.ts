import { sourceImage } from "../lib/sources/images";
import { canonical, clean, closest } from "../lib/normalize";
import { suggestions } from "../lib/sources/nlmConditions";
import { trials } from "../lib/sources/clinicalTrials";
import { labels } from "../lib/sources/openFda";
import { research, monthlyVolume } from "../lib/sources/pubmed";
import { overview } from "../lib/sources/medlinePlus";
import { dailyMed } from "../lib/sources/dailyMed";
const memory = new Map<
  string,
  { expires: number; body: string; ttl: number }
>();
type Snapshot = { body: string; status: number; headers: [string, string][] };
const inFlight = new Map<string, Promise<Snapshot>>();
function fromSnapshot(s: Snapshot) {
  return new Response(s.body, { status: s.status, headers: s.headers });
}
export async function api(request: Request): Promise<Response> {
  const u = new URL(request.url),
    kind = u.pathname.split("/").pop() ?? "",
    raw = clean(u.searchParams.get("q")),
    q = kind === "location" ? raw : canonical(raw),
    country = clean(u.searchParams.get("country") ?? "US").toUpperCase();
  if (kind === "image") return sourceImage(q);
  if (!q)
    return Response.json(
      { error: "Enter a condition to get started." },
      { status: 400 },
    );
  const key = JSON.stringify([
    kind,
    q.toLowerCase(),
    kind === "location" ? country : "",
  ]);
  const hit = memory.get(key);
  if (hit && hit.expires > Date.now()) return reply(hit.body, hit.ttl);
  if (inFlight.has(key)) return fromSnapshot(await inFlight.get(key)!);
  const work = load().then(async (r) => ({
    body: await r.text(),
    status: r.status,
    headers: [...r.headers] as [string, string][],
  }));
  inFlight.set(key, work);
  try {
    return fromSnapshot(await work);
  } finally {
    inFlight.delete(key);
  }
  async function load() {
    try {
      let data: unknown;
      switch (kind) {
        case "conditions": {
          try {
            const result = await suggestions(q);
            data = {
              ...result,
              suggestions: [
                ...new Set([...(q !== raw ? [q] : []), ...result.suggestions]),
              ].slice(0, 8),
            };
          } catch {
            data = { suggestions: closest(q), fuzzy: true, fallback: true };
          }
          break;
        }
        case "trials":
          data = await trials(q);
          break;
        case "treatments":
          data = await labels(q);
          break;
        case "research":
          data = await research(q);
          break;
        case "volume":
          data = await monthlyVolume(q);
          break;
        case "overview":
          data = await overview(q);
          break;
        case "dailymed":
          data = await dailyMed(q);
          break;
        case "location": {
          const postal = q.toUpperCase().replace(/[ -]/g, "");
          const patterns: Record<string, RegExp> = {
            US: /^\d{5}(?:\d{4})?$/,
            GB: /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/,
            CA: /^[A-Z]\d[A-Z]\d[A-Z]\d$/,
            DE: /^\d{5}$/,
            FR: /^\d{5}$/,
            AU: /^\d{4}$/,
          };
          if (!patterns[country]?.test(postal))
            return Response.json(
              {
                error:
                  "Check the postal code and selected country. For example: 10001 (US).",
              },
              { status: 400 },
            );
          let code = country === "US" ? postal.slice(0, 5) : postal;
          if (country === "GB") code = postal.slice(0, -3);
          if (country === "CA") code = postal.slice(0, 3);
          const r = await fetch(
            "https://api.zippopotam.us/" +
              country +
              "/" +
              encodeURIComponent(code),
            { signal: AbortSignal.timeout(10000) },
          );
          if (!r.ok)
            throw new Error(
              "That postal code could not be located. Try a nearby code.",
            );
          const d = (await r.json()) as {
            places?: { latitude: string; longitude: string }[];
          };
          const lat = Number(d.places?.[0]?.latitude),
            lon = Number(d.places?.[0]?.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lon))
            throw Error("No coordinates returned for that postal code.");
          data = { lat, lon };
          break;
        }
        default:
          return Response.json({ error: "Unknown source" }, { status: 404 });
      }
      const ttl =
        kind === "trials"
          ? 3600
          : ["research", "volume"].includes(kind)
            ? 21600
            : 86400;
      const body = JSON.stringify({ data, updated: new Date().toISOString() });
      memory.set(key, { body, expires: Date.now() + ttl * 1000, ttl });
      if (memory.size > 300) memory.delete(memory.keys().next().value!);
      return reply(body, ttl);
    } catch (e) {
      return Response.json(
        {
          error: e instanceof Error ? e.message : "Source unavailable",
          updated: new Date().toISOString(),
        },
        { status: 502 },
      );
    }
  }
}
function reply(body: string, ttl: number) {
  return new Response(body, {
    headers: {
      "content-type": "application/json",
      "cache-control": `public, max-age=60, s-maxage=${ttl}`,
      "x-content-type-options": "nosniff",
    },
  });
}
