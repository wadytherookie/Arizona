import { json, quoted } from "./http";
import type { Paper } from "../types";
const root = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
export async function research(q: string) {
  const term = quoted(q) + "[Title/Abstract]",
    now = new Date(),
    start = new Date(now.getTime() - 90 * 86400000),
    date = (d: Date) => d.toISOString().slice(0, 10).replaceAll("-", "/");
  const search = await json(
    root +
      "esearch.fcgi?" +
      new URLSearchParams({
        db: "pubmed",
        term,
        retmode: "json",
        mindate: date(start),
        maxdate: date(now),
        datetype: "pdat",
        retmax: "24",
        sort: "pub_date",
      }),
  );
  const ids = search.esearchresult?.idlist ?? [];
  if (!ids.length)
    return { papers: [], count: Number(search.esearchresult?.count ?? 0) };
  const d = await json(
    root +
      "esummary.fcgi?" +
      new URLSearchParams({ db: "pubmed", id: ids.join(","), retmode: "json" }),
  );
  const papers: Paper[] = ids.map((id: string) => {
    const r = d.result?.[id] ?? {};
    return {
      id,
      title: r.title ?? "Untitled record",
      journal: r.fulljournalname ?? r.source ?? "",
      date: r.epubdate ? "Online " + r.epubdate : (r.pubdate ?? ""),
      url: "https://pubmed.ncbi.nlm.nih.gov/" + id + "/",
    };
  });
  return { papers, count: Number(search.esearchresult?.count ?? 0) };
}
export async function monthlyVolume(q: string) {
  const months: { month: string; count: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    await new Promise((r) => setTimeout(r, 400));
    const now = new Date(),
      start = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
      ),
      end =
        i === 0
          ? now
          : new Date(
              Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0),
            );
    const date = (d: Date) => d.toISOString().slice(0, 10).replaceAll("-", "/");
    const d = await json(
      root +
        "esearch.fcgi?" +
        new URLSearchParams({
          db: "pubmed",
          term: quoted(q) + "[Title/Abstract]",
          retmode: "json",
          datetype: "pdat",
          mindate: date(start),
          maxdate: date(end),
          retmax: "0",
        }),
    );
    months.push({
      month: start.toISOString().slice(0, 7),
      count: Number(d.esearchresult?.count ?? 0),
    });
  }
  return months;
}
