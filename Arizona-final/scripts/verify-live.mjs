import assert from "node:assert/strict";
const base = process.argv[2] || "http://127.0.0.1:3000";
const checks = [
  [
    "conditions",
    "diabetis",
    (d) => assert.ok(d.suggestions.some((s) => /diabet/i.test(s))),
  ],
  ["overview", "Asthma", (d) => assert.ok(d.some((x) => x.summary && x.url))],
  [
    "trials",
    "Asthma",
    (d) =>
      assert.ok(
        Array.isArray(d.trials) &&
          d.trials.length &&
          d.trials[0].id.startsWith("NCT"),
      ),
  ],
  [
    "treatments",
    "Asthma",
    (d) => assert.ok(Array.isArray(d.labels) && d.labels.some((x) => x.url)),
  ],
  [
    "research",
    "Asthma",
    (d) =>
      assert.ok(
        d.papers.every((p) => p.url.includes("pubmed")) &&
          d.count >= d.papers.length,
      ),
  ],
  ["volume", "Asthma", (d) => assert.equal(d.length, 4)],
  ["dailymed", "albuterol", (d) => assert.ok(d.length)],
  ["location", "10001", (d) => assert.ok(Number.isFinite(d.lat))],
];
const results = await Promise.allSettled(
  checks.map(async ([source, q, validate]) => {
    const r = await fetch(
      base + "/api/" + source + "?q=" + encodeURIComponent(q),
      { signal: AbortSignal.timeout(90000) },
    );
    const json = await r.json();
    assert.equal(r.status, 200, source + ": " + json.error);
    validate(json.data);
    console.log("PASS " + source + " · " + json.updated);
  }),
);
const errors = results.flatMap((r, i) =>
  r.status === "rejected" ? [checks[i][0] + ": " + r.reason.message] : [],
);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
}
