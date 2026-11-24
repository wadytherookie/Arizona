import { json, quoted } from "./http";
export async function approval(
  application: string,
): Promise<{ year: string; url: string } | null> {
  const number = application.match(/(?:NDA|ANDA|BLA)\d+/)?.[0];
  if (!number) return null;
  let d;
  try {
    d = await json(
      "https://api.fda.gov/drug/drugsfda.json?" +
        new URLSearchParams({
          search: "application_number:" + quoted(number),
          limit: "1",
        }),
    );
  } catch {
    return null;
  }
  const original = (d.results?.[0]?.submissions ?? [])
    .filter(
      (s: any) =>
        s.submission_type === "ORIG" &&
        s.submission_status === "AP" &&
        /^\d{8}$/.test(s.submission_status_date ?? ""),
    )
    .sort((a: any, b: any) =>
      a.submission_status_date.localeCompare(b.submission_status_date),
    )[0];
  if (!original) return null;
  return {
    year: original.submission_status_date.slice(0, 4),
    url:
      "https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo=" +
      number.replace(/\D/g, ""),
  };
}
