import { XMLParser } from "fast-xml-parser";
export async function overview(q: string) {
  const r = await fetch(
    "https://wsearch.nlm.nih.gov/ws/query?" +
      new URLSearchParams({ db: "healthTopics", term: q, retmax: "3" }),
    { signal: AbortSignal.timeout(20000) },
  );
  if (!r.ok) throw new Error("MedlinePlus unavailable");
  const d = new XMLParser({ ignoreAttributes: false }).parse(await r.text());
  let docs = d?.nlmSearchResult?.list?.document ?? [];
  if (!Array.isArray(docs)) docs = [docs];
  return docs
    .map((doc: any) => {
      let c = doc.content ?? [];
      if (!Array.isArray(c)) c = [c];
      const text = (name: string) =>
        String(c.find((x: any) => x["@_name"] === name)?.["#text"] ?? "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      return {
        title: text("title"),
        summary: text("FullSummary"),
        url: doc["@_url"] ?? "https://medlineplus.gov/",
      };
    })
    .filter((x: any) => x.title);
}
