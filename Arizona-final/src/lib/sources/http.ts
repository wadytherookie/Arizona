let ncbiNext = 0;
export async function json(url: string) {
  if (new URL(url).hostname === "eutils.ncbi.nlm.nih.gov") {
    const at = Math.max(Date.now(), ncbiNext);
    ncbiNext = at + 400;
    await new Promise((r) => setTimeout(r, Math.max(0, at - Date.now())));
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    });
    if ((r.status === 429 || r.status === 503) && attempt === 0) {
      await new Promise((r) => setTimeout(r, 1200));
      continue;
    }
    if (!r.ok) throw new Error(`Source returned ${r.status}`);
    return r.json();
  }
  throw new Error("Source is busy. Please try again shortly.");
}
export const quoted = (s: string) => '"' + s.replace(/["\\]/g, "") + '"';
