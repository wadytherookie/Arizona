import { build } from "esbuild";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const dir = await mkdtemp(join(tmpdir(), "arizona-check-"));
try {
  const out = join(dir, "verify.mjs");
  await build({
    stdin: {
      contents: `export * from './src/lib/palette';export * from './src/lib/normalize';export * from './src/lib/theme';export * from './src/lib/sources/clinicalTrials';export * from './src/lib/sources/openFda';`,
      resolveDir: process.cwd(),
    },
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: out,
  });
  const m = await import(pathToFileURL(out));
  assert.equal(m.canonical("  diabetis  "), "Type 2 diabetes");
  assert.equal(m.canonical("heart attack"), "Myocardial infarction");
  assert.equal(m.canonical("type2 diabetes"), "Type 2 diabetes");
  assert.equal(m.clean(null), "");
  assert.equal(m.distance("asthma", "asthm"), 1);
  const result = m.normalizeTrials([
    null,
    {},
    { protocolSection: { identificationModule: { nctId: "NCT1" } } },
    { protocolSection: { identificationModule: { nctId: "NCT1" } } },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].status, "UNKNOWN");
  assert.deepEqual(result[0].sites, []);
  assert.deepEqual(result[0].phase, []);
  assert.ok(m.closest("asthm").includes("Asthma"));
  assert.equal(m.themeTones("#ffffff").light, "hsl(0 0% 23%)");
  assert.equal(
    m.hasAffirmativeMention("Not indicated for asthma.", "Asthma"),
    false,
  );
  assert.equal(
    m.hasAffirmativeMention(
      "Indicated for maintenance treatment of asthma. Not for acute attacks.",
      "Asthma",
    ),
    true,
  );
  for (const color of [
    "#f35ca6",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#00ffff",
    "#ff00ff",
    "#000000",
    "#ffffff",
  ])
    for (const coverage of [0, 50, 100])
      for (const dark of [false, true]) {
        const p = m.palette(color, coverage, dark);
        assert.ok(
          m.contrast(p["--ink"], p["--bg"]) >= 4.5,
          "Body contrast " + color,
        );
        assert.ok(
          m.contrast(p["--muted"], p["--surface"]) >= 4.5,
          "Muted text contrast " + color,
        );
        assert.ok(
          m.contrast(p["--strong"], p["--bg"]) >= 4.5,
          "Button contrast " + color,
        );
        if (color === "#f35ca6" && coverage === 100 && !dark) {
          assert.notEqual(p["--bg"], "#ffffff");
          assert.notEqual(p["--surface"], "#ffffff");
        }
      }
  for (const [file, signature] of [
    ["public/images/normal-brain.png", "89504e47"],
    ["public/images/brain-infarct.jpg", "ffd8ff"],
    ["public/images/chest-comparison.jpg", "ffd8ff"],
  ])
    assert.ok(
      (await (await import("node:fs/promises")).readFile(file))
        .toString("hex")
        .startsWith(signature),
      "Real image bytes " + file,
    );
  console.log(
    "PASS: full-site palette contrast across 54 color/mode/coverage combinations; all three bundled image files.",
  );
  console.log(
    "PASS: aliases, input normalization, typo ranking, null trial fields, deduplication and arbitrary-color contrast tones.",
  );
} finally {
  await rm(dir, { recursive: true, force: true });
}
if ((await import("node:fs")).existsSync("dist/server/index.js")) {
  const worker = (await import("../dist/server/index.js")).default;
  const priorCache = Object.getOwnPropertyDescriptor(globalThis, "caches");
  Object.defineProperty(globalThis, "caches", {
    configurable: true,
    value: {
      get default() {
        throw Error("Host does not allow cache access");
      },
    },
  });
  try {
    const response = await worker.fetch(
      new Request("https://arizona.test/api/trials?q="),
      {},
      { waitUntil() {} },
    );
    assert.equal(response.status, 400);
    assert.ok((await response.json()).error);
    console.log("PASS: denied platform cache does not break API responses.");
  } finally {
    if (priorCache) Object.defineProperty(globalThis, "caches", priorCache);
    else delete globalThis.caches;
  }
}
