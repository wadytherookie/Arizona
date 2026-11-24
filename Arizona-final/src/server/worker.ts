import { api } from "./handler";
import assets from "virtual:assets";
export default {
  async fetch(
    request: Request,
    env: unknown,
    ctx: { waitUntil: (p: Promise<unknown>) => void },
  ) {
    if (new URL(request.url).pathname.startsWith("/api/")) {
      if (request.method !== "GET")
        return new Response("Method not allowed", { status: 405 });
      let cache: any;
      try {
        cache = (globalThis as any).caches?.default;
        const hit = await cache?.match(request);
        if (hit) return hit;
      } catch {
        cache = undefined;
      }
      const response = await api(request);
      if (cache && response.ok)
        ctx.waitUntil(cache.put(request, response.clone()).catch(() => {}));
      return response;
    }
    const path = new URL(request.url).pathname;
    const asset =
      assets[path === "/" ? "/index.html" : path] ??
      assets[path + "/index.html"];
    if (!asset) return new Response("Page not found", { status: 404 });
    const bytes = Uint8Array.from(atob(asset.body), (c) => c.charCodeAt(0));
    return new Response(request.method === "HEAD" ? null : bytes, {
      headers: {
        "content-type": asset.type,
        "cache-control": path.startsWith("/_next/static/")
          ? "public, max-age=31536000, immutable"
          : "public, max-age=300",
        "x-content-type-options": "nosniff",
        "referrer-policy": "strict-origin-when-cross-origin",
      },
    });
  },
};
