import { json } from "./http";
export async function dailyMed(q: string) {
  const d = await json(
    "https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?" +
      new URLSearchParams({ drug_name: q, pagesize: "5" }),
  );
  return d.data ?? [];
}
