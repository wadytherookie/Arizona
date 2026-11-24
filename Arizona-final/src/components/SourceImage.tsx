"use client";
import { useState } from "react";
export default function SourceImage({
  asset,
  alt,
}: {
  asset: string;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);
  const filename =
    asset === "normal-brain" ? "normal-brain.png" : asset + ".jpg";
  return failed ? (
    <div className="image-unavailable">
      <strong>The image host is temporarily unavailable.</strong>
      <span>Use the original-image link below to view the source.</span>
    </div>
  ) : (
    <img
      src={"/images/" + filename}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
