import { build } from "esbuild";
import { mkdir, cp, readdir, readFile } from "node:fs/promises";
import path from "node:path";
if (process.env.ARIZONA_HOST !== "vercel") {
  await mkdir("dist/server", { recursive: true });
  await cp("out", "dist/client", { recursive: true });
  const assets = {};
  const mime = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json",
    ".txt": "text/plain; charset=utf-8",
    ".ico": "image/x-icon",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".png": "image/png",
    ".jpg": "image/jpeg",
  };
  async function collect(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const filename = path.join(dir, entry.name);
      if (entry.isDirectory()) await collect(filename);
      else if (!entry.name.endsWith(".map"))
        assets["/" + path.relative("out", filename).split(path.sep).join("/")] =
          {
            body: (await readFile(filename)).toString("base64"),
            type: mime[path.extname(filename)] || "application/octet-stream",
          };
    }
  }
  await collect("out");
  await build({
    entryPoints: ["src/server/worker.ts"],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    outfile: "dist/server/index.js",
    minify: true,
    plugins: [
      {
        name: "embedded-assets",
        setup(b) {
          b.onResolve({ filter: /^virtual:assets$/ }, () => ({
            path: "assets",
            namespace: "embedded",
          }));
          b.onLoad({ filter: /.*/, namespace: "embedded" }, () => ({
            contents: "export default " + JSON.stringify(assets),
            loader: "js",
          }));
        },
      },
    ],
  });
}
