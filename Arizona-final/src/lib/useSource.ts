"use client";
import { useEffect, useState } from "react";
export type Load = {
  loading: boolean;
  data: any;
  error?: string;
  updated?: string;
};
export function useSource(kind: string, q: string) {
  const [s, set] = useState<Load>({ loading: false, data: null });
  const [retry, bump] = useState(0);
  useEffect(() => {
    if (!q) {
      set({ loading: false, data: null });
      return;
    }
    const c = new AbortController();
    set({ loading: true, data: null });
    fetch("/api/" + kind + "?q=" + encodeURIComponent(q), { signal: c.signal })
      .then(async (r) => {
        if (!r.headers.get("content-type")?.includes("application/json"))
          throw Error(
            "The public source is temporarily unavailable. Please try again shortly.",
          );
        const d = await r.json();
        if (!r.ok || d.error) throw Error(d.error || "Source unavailable");
        set({ loading: false, ...d });
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          set({ loading: false, data: null, error: e.message });
      });
    return () => c.abort();
  }, [kind, q, retry]);
  return { ...s, retry: () => bump((x) => x + 1) };
}
