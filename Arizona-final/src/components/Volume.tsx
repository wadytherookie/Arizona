"use client";
import { useEffect, useState } from "react";
export default function Volume({ condition }: { condition: string }) {
  const [data, set] = useState<{ month: string; count: number }[]>([]),
    [error, setError] = useState(false);
  useEffect(() => {
    set([]);
    setError(false);
    const c = new AbortController();
    const timer = setTimeout(
      () =>
        fetch("/api/volume?q=" + encodeURIComponent(condition), {
          signal: c.signal,
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.error) throw Error();
            set(d.data ?? []);
          })
          .catch((e) => {
            if (e.name !== "AbortError") setError(true);
          }),
      1500,
    );
    return () => {
      clearTimeout(timer);
      c.abort();
    };
  }, [condition]);
  const max = Math.max(1, ...data.map((x) => x.count));
  return (
    <div className="volume">
      <div>
        <span className="eyebrow">PUBLICATION PULSE</span>
        <p>Monthly publication volume</p>
        <small>Four calendar months · current month is incomplete</small>
      </div>
      {error ? (
        <span className="muted">
          Trend temporarily unavailable. Papers remain available below.
        </span>
      ) : !data.length ? (
        <span className="muted">Loading publication trend…</span>
      ) : (
        <div className="sparkline">
          <svg
            viewBox="0 0 340 80"
            role="img"
            aria-label={data
              .map((x) => x.month + ": " + x.count + " publications")
              .join("; ")}
          >
            <line x1="15" x2="325" y1="70" y2="70" stroke="var(--line)" />
            <polyline
              points={data
                .map((x, i) => `${15 + i * 103},${65 - (x.count / max) * 50}`)
                .join(" ")}
              fill="none"
              stroke="var(--strong)"
              strokeWidth="2"
            />
            {data.map((x, i) => (
              <g key={x.month}>
                <circle
                  cx={15 + i * 103}
                  cy={65 - (x.count / max) * 50}
                  r="3"
                  fill="var(--strong)"
                />
                <text
                  x={15 + i * 103}
                  y={Math.max(10, 55 - (x.count / max) * 50)}
                  fill="var(--ink)"
                  fontSize="12"
                  textAnchor="middle"
                >
                  {x.count}
                </text>
              </g>
            ))}
          </svg>
          <div>
            {data.map((x) => (
              <span key={x.month}>
                {new Date(x.month + "-02").toLocaleDateString(undefined, {
                  month: "short",
                })}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
