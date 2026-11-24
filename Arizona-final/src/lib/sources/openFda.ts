import { json, quoted } from "./http";
import { approval } from "./drugsFda";
import type { Treatment } from "../types";
export async function labels(q: string) {
  const u =
    "https://api.fda.gov/drug/label.json?" +
    new URLSearchParams({
      search: "indications_and_usage:" + quoted(q),
      limit: "50",
    });
  let d;
  try {
    d = await json(u);
  } catch (e) {
    if (String(e).includes("404")) return { labels: [], partial: false };
    throw e;
  }
  const seen = new Set();
  const records: Treatment[] = (d.results ?? []).flatMap((r: any) => {
    const f = r.openfda ?? {},
      name = f.generic_name?.[0] ?? f.brand_name?.[0];
    const indication = r?.indications_and_usage?.join(" ") ?? "";
    if (
      !name ||
      !f.application_number?.length ||
      !hasAffirmativeMention(indication, q) ||
      seen.has(name.toLowerCase())
    )
      return [];
    seen.add(name.toLowerCase());
    const warnings = (
      r.boxed_warning ??
      r.warnings_and_cautions ??
      r.warnings ?? ["See full prescribing information"]
    ).join(" ");
    return [
      {
        id: r.id,
        name,
        route: f.route?.join(", ") ?? "See label",
        warnings,
        warningTopics: warningTopics(warnings),
        indication: r.indications_and_usage?.join(" ") ?? "",
        application: f.application_number?.join(", ") ?? "Not supplied",
        url: r.set_id
          ? "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=" +
            encodeURIComponent(r.set_id)
          : "https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=" +
            encodeURIComponent(name),
      },
    ];
  });
  const picked = records.slice(0, 12);
  for (let i = 0; i < picked.length; i += 3) {
    await Promise.all(
      picked.slice(i, i + 3).map(async (t) => {
        const a = await approval(t.application);
        if (a) {
          t.approvalYear = a.year;
          t.approvalUrl = a.url;
        }
      }),
    );
  }
  return {
    labels: picked.filter((t) => t.approvalYear),
    partial: (d.meta?.results?.total ?? 0) > 50 || records.length > 12,
  };
}
export function hasAffirmativeMention(text: string, condition: string) {
  const q = condition.toLowerCase();
  return text
    .split(/(?<=[.!?])\s+|[\n;]/)
    .some(
      (s) =>
        s.toLowerCase().includes(q) &&
        !/\bnot\s+(?:(?:been|be)\s+)?(?:indicated|approved|established|studied|used|for)|\bcontraindicated/i.test(
          s,
        ),
    );
}
function warningTopics(s: string) {
  return [
    { r: /anaphylaxis|hypersensitivity/i, t: "Serious allergic reactions" },
    {
      r: /serious infections|tuberculosis|opportunistic infections/i,
      t: "Serious infections",
    },
    { r: /suicid/i, t: "Suicidal thoughts or behavior" },
    { r: /bronchospasm/i, t: "Sudden worsening of breathing" },
    {
      r: /cardiovascular|myocardial infarction|arrhythmia/i,
      t: "Heart or circulation risks",
    },
    { r: /hepatotoxicity|liver injury/i, t: "Liver injury" },
    { r: /hypoglyc/i, t: "Low blood sugar" },
    { r: /malignan|lymphoma/i, t: "Cancer-related warnings" },
    { r: /bleeding|hemorrhage/i, t: "Bleeding risks" },
  ]
    .filter((x) => x.r.test(s))
    .slice(0, 3)
    .map((x) => x.t);
}
