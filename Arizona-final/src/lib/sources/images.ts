export const imageSources: Record<string, string> = {
  "normal-brain":
    "https://upload.wikimedia.org/wikipedia/commons/9/96/CT_of_a_normal_brain%2C_axial_25.png",
  "brain-infarct":
    "https://upload.wikimedia.org/wikipedia/commons/e/e9/CT_Brain_MCA_Infarct.jpg",
  "chest-comparison":
    "https://upload.wikimedia.org/wikipedia/commons/2/24/Chest_X-ray_images_showing_normal_and_pneumonia.jpg",
};
export async function sourceImage(asset: string) {
  const url = imageSources[asset];
  if (!url) return new Response("Unknown image", { status: 404 });
  const r = await fetch(url, {
    headers: { "User-Agent": "Arizona/1.0 educational medical atlas" },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok)
    return new Response("Image source temporarily unavailable", {
      status: 502,
    });
  const type = r.headers.get("content-type") ?? "";
  if (!type.startsWith("image/"))
    return new Response("Invalid image response", { status: 502 });
  return new Response(r.body, {
    headers: {
      "content-type": type,
      "cache-control": "public, max-age=86400",
      "x-content-type-options": "nosniff",
    },
  });
}
