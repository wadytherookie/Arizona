# Arizona

**Start with [GITHUB_SETUP.md](GITHUB_SETUP.md) to upload the ZIP to GitHub and deploy without a terminal.**

A searchable medical atlas built with Next.js, React and TypeScript. Visitors use the published URL; no terminal or locally running computer is needed. The default deployment pairs a static Next.js frontend with a thin Cloudflare Worker. The same source can be hosted on Vercel with native Next API routes.

## Configuration

Edit `src/config/arizona.ts` for the app name, full-site default color, coverage, default appearance mode, default condition, curated starting conditions and aliases. Search accepts any condition; the starting-condition list is not a coverage restriction. Unknown or uncommon names can be searched directly even if NLM has no vocabulary match. Source coverage is not universal.

Appearance defaults to bright pink in light mode. The full-spectrum picker and hex field recolor backgrounds, cards, buttons, borders and highlights together. A coverage slider controls how strongly color fills the site. Light/dark/system modes remain optional; the OS does not force dark mode by default. Preferences are stored under `arizona-appearance-v2`. Palette contrast is checked for body, secondary text and buttons.

## Development and checks

Node 22 or later is recommended.

```sh
npm ci
npm run dev
npm run typecheck
npm run verify
npm run build
```

`verify` covers alias normalization, typos, duplicate IDs, missing/null trial records and color contrast tones. Webpack is selected to avoid Windows junction restrictions in Turbopack. Data adapters are in `src/lib/sources/`, UI is in `src/components/`, client fetching is in `src/lib/useSource.ts`, and API orchestration/cache is in `src/server/handler.ts`.

## Deployment

The portable ZIP contains no existing deployment identity. The default build produces `dist/server/index.js` and `dist/client/` for a Worker deployment. For GitHub + Vercel, use the configuration below. Publication does not rely on a development server.

For a GitHub + Vercel deployment, import this repository in Vercel, set `ARIZONA_HOST=vercel` in the project environment, select the Next.js preset, and use `npm run build`. Vercel builds the API routes in `src/pages/api/[source].ts`. Pushes to the linked production branch trigger deployments. GitHub Pages alone cannot run the server-side proxy.

No API keys are required for this version. No user account, patient information, scan upload or diagnostic classifier is implemented. Postal lookup sends the entered postal code and selected country to Zippopotam.us through the server; it never requests device geolocation.

## Source behavior and limitations

| Source/module                                   | Handling                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ClinicalTrials.gov API v2 / `clinicalTrials.ts` | Requests selected fields, up to 200 records. Deduplicates NCT IDs, tolerates missing modules and coordinates, and marks truncated/partially fetched results. Phase counts, geographic counts and recruiting counts refer to loaded records, with a `+` when truncated. Eligibility is cleaned into source excerpts, not machine-generated medical advice. Original criteria remain accessible. Other registries are not separately imported.                                                                                      |
| NLM Clinical Tables / `nlmConditions.ts`        | Debounced search, prefix fallback, edit-distance ranking and aliases. When live vocabulary is unavailable, local suggestions are explicitly marked. NLM vocabulary is not exhaustive.                                                                                                                                                                                                                                                                                                                                             |
| MedlinePlus / `medlinePlus.ts`                  | Parses health-topic XML and strips HTML before rendering. Shows the matched topic and its source, including when the topic is broader than the search.                                                                                                                                                                                                                                                                                                                                                                            |
| openFDA labels / `openFda.ts`                   | Searches indications text and deduplicates ingredient names; shows up to 12 label matches. Records mentioning the condition only in a negative indication statement are excluded by a conservative text check. Only records with a verified FDA application are displayed; this is still not a clinically curated, indication-verified approval list. Warning-topic labels are a reading aid; original warnings are retained.                                                                                                     |
| Drugs@FDA / `drugsFda.ts`                       | Joins label application numbers to original approved submissions. The displayed year is the original application year, not the date a particular indication was approved. Missing approval joins are omitted. The hero counts matched applications, not every approved treatment.                                                                                                                                                                                                                                                 |
| DailyMed / `dailyMed.ts`                        | Live SPL search adapter; cards link to the exact SPL set ID where supplied by openFDA, otherwise a DailyMed name search.                                                                                                                                                                                                                                                                                                                                                                                                          |
| PubMed / `pubmed.ts`                            | Uses a bounded 90-day publication-date search and ESummary. Prefers electronic publication dates to avoid displaying a future print issue as the publication date. Separate monthly searches generate the trend; the current month is incomplete. Queries are title/abstract matches, not a systematic review. Results are not ranked by clinical quality.                                                                                                                                                                        |
| Zippopotam.us / `handler.ts`                    | Normalizes postal codes and validates US, GB, CA, DE, FR and AU formats. US ZIP+4 uses the 5-digit ZIP; GB/CA use area-level coordinates. Distances are straight-line approximations. Source coverage can be incomplete.                                                                                                                                                                                                                                                                                                          |
| Imaging / `Imaging.tsx`, `ScanComparisons.tsx`  | Ten modality explanations linked to RadiologyInfo. Two curated visual examples: brain CT normal anatomy versus a separate infarct case, and source-labeled chest radiographs. These are not matched before/after cases or a universal comparison atlas. Arbitrary condition/modality literature links point to PMC. Real image files are bundled in `public/images`, with source, author and license attribution in `src/config/imaging.ts` and `IMAGE_CREDITS.md`. Click an image to enlarge it in a keyboard-accessible dialog. |

## Cache and failure handling

Normalized cache keys include source, condition and country for postal lookup. Trials: 1 hour; research/trend: 6 hours; vocabulary, labels, overview and postal locations: 24 hours. A bounded in-memory cache and request coalescing run in the server; the Worker additionally uses edge cache for successful responses when the host permits it; otherwise the memory cache remains active. Each section has independent loading, empty, error and retry handling. NCBI requests are spaced within each process; short retries cover transient 429/503 responses. Public-source limits still apply across multiple server instances.

## Credits

- Normal head CT: Mikael Häggström, MD, [original](https://commons.wikimedia.org/wiki/File:CT_of_a_normal_brain,_axial_25.png), [CC0](https://creativecommons.org/publicdomain/zero/1.0/), unmodified.
- MCA infarct CT: Lucien Monfils, [original](https://commons.wikimedia.org/wiki/File:CT_Brain_MCA_Infarct.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), unmodified.
- Chest radiographs: NahomNati, [original](https://commons.wikimedia.org/wiki/File:Chest_X-ray_images_showing_normal_and_pneumonia.jpg), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), unmodified.
- World map: [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/), public domain; 1:110m land outlines projected for the site plot.

This application is informational. It does not diagnose, interpret patient scans, determine trial eligibility or recommend treatment. Clinical review is necessary before extending it with indication-specific approval claims or additional curated scan comparisons.
