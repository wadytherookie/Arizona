import { json } from "./http";
import type { Trial } from "../types";
type Study = {
  protocolSection?: {
    identificationModule?: { nctId?: string; briefTitle?: string };
    statusModule?: { overallStatus?: string };
    designModule?: { phases?: string[] };
    descriptionModule?: { briefSummary?: string };
    eligibilityModule?: {
      eligibilityCriteria?: string;
      sex?: string;
      minimumAge?: string;
    };
    contactsLocationsModule?: {
      locations?: {
        facility?: string;
        city?: string;
        country?: string;
        status?: string;
        geoPoint?: { lat?: number; lon?: number };
      }[];
    };
  };
};
export function normalizeTrials(records: (Study | null)[]): Trial[] {
  const seen = new Set<string>();
  return records.flatMap((r) => {
    const p = r?.protocolSection ?? {},
      id = p.identificationModule?.nctId;
    if (!id || seen.has(id)) return [];
    seen.add(id);
    return [
      {
        id,
        title: p.identificationModule?.briefTitle || "Untitled study",
        status: (p.statusModule?.overallStatus || "UNKNOWN").toUpperCase(),
        phase: Array.isArray(p.designModule?.phases)
          ? p.designModule!.phases!
          : [],
        summary: p.descriptionModule?.briefSummary ?? "",
        eligibility: p.eligibilityModule?.eligibilityCriteria ?? "",
        sex: p.eligibilityModule?.sex ?? "Not specified",
        minimumAge: p.eligibilityModule?.minimumAge ?? "Not specified",
        sites: (p.contactsLocationsModule?.locations ?? [])
          .filter(Boolean)
          .map((s) => ({
            name: s.facility || "Site not named",
            city: s.city ?? "",
            country: s.country ?? "",
            status: s.status,
            lat: Number.isFinite(s.geoPoint?.lat) ? s.geoPoint!.lat : undefined,
            lon: Number.isFinite(s.geoPoint?.lon) ? s.geoPoint!.lon : undefined,
          })),
      },
    ];
  });
}
export async function trials(q: string) {
  const records: Study[] = [];
  let token = "",
    total = 0,
    partial = false;
  for (let page = 0; page < 2; page++) {
    const p = new URLSearchParams({
      "query.cond": q,
      pageSize: "100",
      countTotal: "true",
      format: "json",
      fields:
        "NCTId,BriefTitle,OverallStatus,Phase,BriefSummary,EligibilityCriteria,Sex,MinimumAge,LocationFacility,LocationCity,LocationCountry,LocationGeoPoint,LocationStatus",
    });
    if (token) p.set("pageToken", token);
    try {
      const d = await json("https://clinicaltrials.gov/api/v2/studies?" + p);
      total = d.totalCount ?? total;
      records.push(...(d.studies ?? []));
      token = d.nextPageToken ?? "";
      if (!token) break;
    } catch (e) {
      if (!records.length) throw e;
      partial = true;
      break;
    }
  }
  return {
    trials: normalizeTrials(records),
    total,
    partial: partial || !!token,
  };
}
