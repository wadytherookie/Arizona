"use client";
import { worldLandPath } from "../lib/worldMap";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  BookOpen,
  FlaskConical,
  Activity,
  Globe2,
  Check,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { config } from "../config/arizona";
import { canonical, closest } from "../lib/normalize";
import Appearance from "../components/Appearance";
import type { Trial, Treatment, Paper } from "../lib/types";
import Imaging from "../components/Imaging";
import Volume from "../components/Volume";
import { useSource, type Load } from "../lib/useSource";
function SourceState({
  state,
  children,
}: {
  state: Load & { retry: () => void };
  children: React.ReactNode;
}) {
  if (state.loading)
    return (
      <div className="skeletons" aria-live="polite" aria-label="Loading source">
        <div />
        <div />
        <div />
      </div>
    );
  if (state.error)
    return (
      <div className="notice">
        <strong>This source is taking a break.</strong>
        <p>{state.error}</p>
        <button onClick={state.retry}>
          <RefreshCw size={15} /> Try again
        </button>
      </div>
    );
  return <>{children}</>;
}
function Stamp({ state, name }: { state: Load; name: string }) {
  return (
    <div className="stamp">
      {name} ·{" "}
      {state.loading
        ? "Checking source…"
        : state.error
          ? "Unavailable"
          : state.updated
            ? "Retrieved " + new Date(state.updated).toLocaleString()
            : "Select a condition"}
    </div>
  );
}
const status = (s: string) =>
  s
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (x) => x.toUpperCase());
const activeStatuses = [
  "RECRUITING",
  "NOT_YET_RECRUITING",
  "ACTIVE_NOT_RECRUITING",
  "ENROLLING_BY_INVITATION",
];
const haversine = (a: number, b: number, c: number, d: number) => {
  const rad = Math.PI / 180;
  const x =
    Math.sin(((c - a) * rad) / 2) ** 2 +
    Math.cos(a * rad) * Math.cos(c * rad) * Math.sin(((d - b) * rad) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};
function Counter({ value }: { value: number | null }) {
  const [n, set] = useState<number | null>(null);
  useEffect(() => {
    if (value === null) {
      set(null);
      return;
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      set(value);
      return;
    }
    const start = performance.now();
    let id = 0;
    const step = (t: number) => {
      const p = Math.min((t - start) / 700, 1);
      set(Math.round(value * (1 - (1 - p) ** 3)));
      if (p < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [value]);
  return <>{n === null ? "—" : n.toLocaleString()}</>;
}
export default function Home() {
  const [condition, setCondition] = useState(""),
    [input, setInput] = useState(""),
    [debounced, setDebounced] = useState(""),
    [suggestOpen, setSuggestOpen] = useState(false),
    [tab, setTab] = useState("overview"),
    [phase, setPhase] = useState("all"),
    [trialStatus, setTrialStatus] = useState("all"),
    [trialSearch, setTrialSearch] = useState(""),
    [postal, setPostal] = useState(""),
    [country, setCountry] = useState("US"),
    [location, setLocation] = useState<{ lat: number; lon: number } | null>(
      null,
    ),
    [locationMessage, setLocationMessage] = useState(""),
    [radius, setRadius] = useState("all"),
    [limit, setLimit] = useState(9),
    [activeSuggestion, setActiveSuggestion] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const p = new URLSearchParams(locationGlobal().search).get("condition");
    if (p) {
      setCondition(canonical(p));
      setInput(canonical(p));
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(
      () => setDebounced(input.trim().replace(/\s+/g, " ")),
      config.searchDebounce,
    );
    return () => clearTimeout(t);
  }, [input]);
  const suggestions = useSource(
    "conditions",
    debounced.length > 1 ? debounced : "",
  );
  const suggestionNames: string[] =
    suggestions.data?.suggestions ?? closest(input);
  const tr = useSource("trials", condition),
    tx = useSource("treatments", condition),
    rs = useSource("research", condition),
    ov = useSource("overview", condition);
  function choose(q: string) {
    q = canonical(q);
    if (!q) return;
    setCondition(q);
    setInput(q);
    setSuggestOpen(false);
    setPhase("all");
    setTrialStatus("all");
    setTrialSearch("");
    setLimit(9);
    history.replaceState({}, "", "?condition=" + encodeURIComponent(q));
    setTab("overview");
  }
  const trials: Trial[] = tr.data?.trials ?? [];
  const eligibleSites = trials
    .filter((t) => activeStatuses.includes(t.status))
    .flatMap((t) => t.sites)
    .filter((s) => !s.status || activeStatuses.includes(s.status));
  const countries = new Set(
    eligibleSites.map((s) => s.country).filter(Boolean),
  );
  const recruiting = trials.filter((t) => t.status === "RECRUITING").length;
  const treatments: Treatment[] = tx.data?.labels ?? [];
  const papers: Paper[] = rs.data?.papers ?? [];
  const nearest = (t: Trial) =>
    t.sites
      .map((s) => ({
        ...s,
        km:
          location && s.lat != null && s.lon != null
            ? haversine(location.lat, location.lon, s.lat, s.lon)
            : null,
      }))
      .sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity))[0];
  const filtered = trials.filter(
    (t) =>
      (phase === "all" || t.phase.includes(phase)) &&
      (trialStatus === "all" || t.status === trialStatus) &&
      (!trialSearch ||
        `${t.id} ${t.title} ${t.summary}`
          .toLowerCase()
          .includes(trialSearch.toLowerCase())) &&
      (radius === "all" ||
        (location &&
          nearest(t)?.km != null &&
          nearest(t).km! <= Number(radius))),
  );
  async function locate() {
    const normalized = postal.trim().toUpperCase().replace(/[ -]/g, "");
    if (!/^[A-Z0-9]{3,10}$/.test(normalized)) {
      setLocationMessage("Enter a postal code, then choose its country.");
      return;
    }
    setLocationMessage("Finding your location…");
    try {
      const r = await fetch(
        "/api/location?q=" +
          encodeURIComponent(normalized) +
          "&country=" +
          country,
      );
      const d = await r.json();
      if (
        !r.ok ||
        !Number.isFinite(d.data?.lat) ||
        !Number.isFinite(d.data?.lon)
      )
        throw Error(
          d.error || "We could not locate that code. Try a nearby code.",
        );
      setLocation(d.data);
      setLocationMessage(
        "Location found. Distances are straight-line estimates.",
      );
    } catch (e) {
      setLocation(null);
      setRadius("all");
      setLocationMessage(String((e as Error).message));
    }
  }
  function navigate(id: string) {
    setTab(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  }
  return (
    <>
      <header className="header">
        <a href="/" className="brand">
          <span className="brand-mark">
            a<span>✳</span>
          </span>
          {config.name}
          <span className="brand-label">THE MEDICAL ATLAS</span>
        </a>
        <nav aria-label="Main navigation">
          <button onClick={() => searchRef.current?.focus()}>
            Explore conditions
          </button>
          <button onClick={() => navigate("trials")}>Clinical trials</button>
          <button onClick={() => navigate("imaging")}>Imaging library</button>
        </nav>
        <Appearance />
      </header>
      <main>
        <section
          className={"hero " + (condition ? "condition-hero" : "")}
          id="overview"
        >
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="tiny-cross">✳</span> SCIENCE, WITH A HUMAN SIDE
            </div>
            <h1>
              {condition ? (
                condition
              ) : (
                <>
                  Medicine moves.
                  <br />
                  Stay <em>in the know.</em>
                </>
              )}
            </h1>
            <p className="hero-description">
              {condition
                ? ov.data?.[0]?.summary
                  ? ov.data[0].summary
                      .replace(/^What (?:is|are)[^?]*\?\s*/i, "")
                      .split(/(?<=[.!?])\s+/)
                      .slice(0, 2)
                      .join(" ")
                  : "Explore what is known, what is being tested, and where research is heading. Public evidence, connected in one place."
                : "From the first question to the latest discovery. Explore conditions, clinical trials, treatments, and medical imaging—all connected to the evidence."}
            </p>
            <div className="search-container">
              <form
                className="search-box"
                onSubmit={(e) => {
                  e.preventDefault();
                  choose(input);
                }}
              >
                <Search size={22} />
                <input
                  ref={searchRef}
                  aria-label="Search any disease or condition"
                  placeholder="Search a disease or condition…"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setSuggestOpen(true);
                    setActiveSuggestion(-1);
                  }}
                  onFocus={() => setSuggestOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setSuggestOpen(false);
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setSuggestOpen(true);
                      setActiveSuggestion((n) =>
                        Math.min(n + 1, suggestionNames.length - 1),
                      );
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActiveSuggestion((n) => Math.max(0, n - 1));
                    }
                    if (
                      e.key === "Enter" &&
                      suggestOpen &&
                      activeSuggestion >= 0
                    ) {
                      e.preventDefault();
                      choose(suggestionNames[activeSuggestion]);
                    }
                  }}
                  role="combobox"
                  aria-expanded={suggestOpen && input.length > 1}
                  aria-controls="condition-suggestions"
                  aria-activedescendant={
                    activeSuggestion >= 0
                      ? `suggestion-${activeSuggestion}`
                      : undefined
                  }
                  autoComplete="off"
                />
                <button type="submit">Explore</button>
              </form>
              {suggestOpen && input.length > 1 && (
                <div
                  className="suggestions"
                  id="condition-suggestions"
                  role="listbox"
                  aria-label="Condition suggestions"
                >
                  <small>
                    {suggestions.loading
                      ? "Looking up conditions…"
                      : suggestions.data?.fuzzy
                        ? "Did you mean…? Choose a suggestion or search your term."
                        : "Suggested conditions · or press Enter to search your term"}
                  </small>
                  {suggestionNames.map((s: string, i: number) => (
                    <button
                      role="option"
                      aria-selected={i === activeSuggestion}
                      id={`suggestion-${i}`}
                      className={i === activeSuggestion ? "selected" : ""}
                      key={s}
                      onClick={() => choose(s)}
                    >
                      <Search size={15} />
                      {s}
                    </button>
                  ))}
                  {(suggestions.error || suggestions.data?.fallback) && (
                    <small>
                      Live suggestions unavailable. Showing closest local
                      matches.
                    </small>
                  )}
                </div>
              )}
            </div>
            <div className="try-row">
              <span>Start with</span>
              {["Asthma", "Type 2 diabetes", "Breast cancer"].map((c) => (
                <button key={c} onClick={() => choose(c)}>
                  {c}
                </button>
              ))}
            </div>
            <div className="hero-trust">
              <Check size={15} /> Public sources. Original links. A little more
              clarity.
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />
            <div className="art-cross">✳</div>
            <div className="floating-note note-top">
              <span className="note-icon">
                <FlaskConical size={20} />
              </span>
              <div>
                Discovery in motion<small>Follow the evidence</small>
              </div>
            </div>
            <div className="floating-note note-bottom">
              <Activity size={22} />
              <div>
                A healthier understanding<small>One question at a time</small>
              </div>
            </div>
            <span className="art-caption">
              CURIOSITY IS A GOOD PLACE TO START.
            </span>
          </div>
        </section>
        <div className="source-strip">
          <span>CONNECTED TO PUBLIC SCIENCE</span>
          <a href="https://clinicaltrials.gov/">ClinicalTrials.gov</a>
          <a href="https://pubmed.ncbi.nlm.nih.gov/">
            PubMed<span> / NCBI</span>
          </a>
          <a href="https://open.fda.gov/">openFDA</a>
          <a href="https://dailymed.nlm.nih.gov/">DailyMed</a>
          <a href="https://medlineplus.gov/">MedlinePlus</a>
        </div>
        {!condition && (
          <section className="section discover">
            <div className="section-heading">
              <div>
                <span className="eyebrow">FIND YOUR STARTING POINT</span>
                <h2>
                  A world of questions.
                  <br />
                  One place to explore.
                </h2>
              </div>
              <p>
                Pick a familiar condition, or search for something
                <br className="desktop" /> you want to understand better.
              </p>
            </div>
            <div className="category-grid">
              {[
                {
                  title: "Heart & circulation",
                  tag: "Cardiovascular health",
                  icon: <Activity />,
                  items: [
                    "Heart failure",
                    "Hypertension",
                    "Myocardial infarction",
                  ],
                  color: "peach",
                },
                {
                  title: "Brain & nerves",
                  tag: "Neurological health",
                  icon: <BookOpen />,
                  items: [
                    "Alzheimer disease",
                    "Multiple sclerosis",
                    "Migraine",
                  ],
                  color: "blue",
                },
                {
                  title: "Immune & inflammatory",
                  tag: "Immune health",
                  icon: <FlaskConical />,
                  items: ["Rheumatoid arthritis", "Crohn disease", "Psoriasis"],
                  color: "green",
                },
                {
                  title: "Metabolic & kidney",
                  tag: "Whole-body health",
                  icon: <Globe2 />,
                  items: [
                    "Type 2 diabetes",
                    "Chronic kidney disease",
                    "Obesity",
                  ],
                  color: "yellow",
                },
              ].map((c) => (
                <article className={"category " + c.color} key={c.title}>
                  <div className="category-icon">{c.icon}</div>
                  <small>{c.tag}</small>
                  <h3>{c.title}</h3>
                  {c.items.map((i) => (
                    <button key={i} onClick={() => choose(i)}>
                      {i}
                    </button>
                  ))}
                </article>
              ))}
            </div>
          </section>
        )}
        {condition && (
          <>
            <div className="stats">
              {[
                {
                  v: tr.data ? recruiting : null,
                  label: "Recruiting trials",
                  icon: <FlaskConical />,
                },
                {
                  v: tx.data
                    ? treatments.filter((t) => t.approvalYear).length
                    : null,
                  label: "Approved applications in label matches",
                  icon: <Check />,
                },
                {
                  v: rs.data?.count ?? null,
                  label: "Papers in the last 90 days",
                  icon: <BookOpen />,
                },
                {
                  v: tr.data ? countries.size : null,
                  label: "Countries in active studies",
                  icon: <Globe2 />,
                },
              ].map((x) => (
                <div key={x.label}>
                  {x.icon}
                  <strong>
                    <Counter value={x.v} />
                    {tr.data?.partial &&
                    [
                      "Recruiting trials",
                      "Countries with active sites",
                    ].includes(x.label)
                      ? "+"
                      : ""}
                  </strong>
                  <span>{x.label}</span>
                </div>
              ))}
            </div>
            <div className="condition-nav">
              {["overview", "trials", "treatments", "research", "imaging"].map(
                (x) => (
                  <button
                    key={x}
                    className={tab === x ? "active" : ""}
                    onClick={() => navigate(x)}
                  >
                    {x}
                  </button>
                ),
              )}
              <span>Evidence, not advice.</span>
            </div>
            <section className="section overview-section">
              <div>
                <span className="eyebrow">UNDERSTAND THE CONDITION</span>
                <h2>The essentials.</h2>
                <a
                  href={
                    "https://medlineplus.gov/search/?query=" +
                    encodeURIComponent(condition)
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Explore MedlinePlus
                </a>
              </div>
              <div>
                <SourceState state={ov}>
                  {ov.data?.length ? (
                    <>
                      <h3>{ov.data[0].title}</h3>
                      <p>
                        {ov.data[0].summary
                          ?.split(/(?<=[.!?])\s+/)
                          .slice(0, 2)
                          .join(" ") ||
                          "Read the linked health topic for a plain-language explanation."}
                      </p>
                      <a href={ov.data[0].url} target="_blank" rel="noreferrer">
                        Read full health topic
                      </a>
                      <small>
                        Search match: check that this topic describes your
                        condition.
                      </small>
                    </>
                  ) : (
                    <p>
                      No matching overview was returned. Try an alternate
                      condition name or browse MedlinePlus.
                    </p>
                  )}
                </SourceState>
                <Stamp state={ov} name="MedlinePlus" />
              </div>
            </section>
          </>
        )}
        <section id="trials" className="section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FROM QUESTIONS TO POSSIBILITIES</span>
              <h2>Research in motion.</h2>
            </div>
            <span className="section-caption">
              Clinical trials
              {condition ? " for " + condition : ". Find what is being tested."}
            </span>
          </div>
          {!condition ? (
            <div className="feature-empty">
              <FlaskConical size={32} />
              <div>
                <h3>Your next question starts here.</h3>
                <p>
                  Search a condition above to see real trials, study phases,
                  eligibility and participating sites.
                </p>
              </div>
              <button
                className="button"
                onClick={() => searchRef.current?.focus()}
              >
                Find a condition
              </button>
            </div>
          ) : (
            <SourceState state={tr}>
              <div className="pipeline">
                {["PHASE1", "PHASE2", "PHASE3", "PHASE4"].map((p, i) => {
                  const n = trials.filter((t) => t.phase.includes(p)).length;
                  return (
                    <button
                      key={p}
                      onClick={() => setPhase(phase === p ? "all" : p)}
                      aria-pressed={phase === p}
                    >
                      <span>
                        Phase {i + 1}
                        <strong>{n}</strong>
                      </span>
                      <div>
                        <i
                          style={{
                            width:
                              (trials.length
                                ? Math.max(3, (n / trials.length) * 100)
                                : 0) + "%",
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="filters">
                <div className="filter-title">
                  <SlidersHorizontal size={16} /> Refine studies
                </div>
                <label>
                  Phase
                  <select
                    value={phase}
                    onChange={(e) => setPhase(e.target.value)}
                  >
                    <option value="all">All phases</option>
                    {[
                      "PHASE1",
                      "PHASE2",
                      "PHASE3",
                      "PHASE4",
                      "EARLY_PHASE1",
                      "NA",
                    ].map((p) => (
                      <option key={p} value={p}>
                        {status(p)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select
                    value={trialStatus}
                    onChange={(e) => setTrialStatus(e.target.value)}
                  >
                    <option value="all">All statuses</option>
                    {[...new Set(trials.map((t) => t.status))]
                      .sort()
                      .map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                  </select>
                </label>
                <label>
                  Search trials
                  <input
                    placeholder="Title, keyword or NCT ID"
                    value={trialSearch}
                    onChange={(e) => setTrialSearch(e.target.value.trimStart())}
                  />
                </label>
                <label>
                  Postal code
                  <input
                    value={postal}
                    onChange={(e) => setPostal(e.target.value)}
                    placeholder="ZIP / postal code"
                  />
                </label>
                <label>
                  Country
                  <select
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      setLocation(null);
                      setRadius("all");
                    }}
                  >
                    {["US", "GB", "CA", "DE", "FR", "AU"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <button className="button secondary" onClick={locate}>
                  Locate
                </button>
                <label>
                  Within
                  <select
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    disabled={!location}
                  >
                    <option value="all">Any distance</option>
                    {[25, 50, 100, 250, 500].map((n) => (
                      <option value={n} key={n}>
                        {n} km
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {locationMessage && (
                <p role="status" className="muted">
                  {locationMessage}
                </p>
              )}
              <div className="results-meta">
                <span>
                  {filtered.length} matching studies in {trials.length} loaded
                  records
                </span>
                <span>
                  {tr.data?.partial
                    ? `Partial coverage · ${tr.data.total} source matches; first 200 loaded`
                    : "Registered studies · not all accept participants"}
                </span>
              </div>
              {!filtered.length ? (
                <div className="notice">
                  No studies match these filters. Try another phase, status or
                  condition.
                </div>
              ) : (
                <div className="trial-grid">
                  {filtered.slice(0, limit).map((t) => {
                    const site = nearest(t);
                    let group = "General";
                    const bullets: { group: string; text: string }[] = [];
                    for (const line of t.eligibility
                      .split(/\r?\n/)
                      .map((x) => x.trim())
                      .filter(Boolean)) {
                      if (/^inclusion criteria/i.test(line))
                        group = "Inclusion";
                      else if (/^exclusion criteria/i.test(line))
                        group = "Exclusion";
                      else
                        bullets.push({
                          group,
                          text: line.replace(/^[-*•\s]+/, ""),
                        });
                    }
                    return (
                      <article className="trial-card" key={t.id}>
                        <div className="card-top">
                          <span
                            className={
                              "chip " +
                              (t.status === "RECRUITING" ? "recruiting" : "")
                            }
                          >
                            {status(t.status)}
                          </span>
                          <span>
                            {t.phase.map(status).join(" / ") ||
                              "Phase not specified"}
                          </span>
                        </div>
                        <h3>
                          <a
                            href={"https://clinicaltrials.gov/study/" + t.id}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t.title}
                          </a>
                        </h3>
                        <p className="trial-summary">
                          {t.summary || "Summary not provided by the registry."}
                        </p>
                        <div className="trial-site">
                          <MapPin size={16} />
                          <span>
                            {site
                              ? [site.name, site.city, site.country]
                                  .filter(Boolean)
                                  .join(", ")
                              : "No sites listed"}
                            {site?.km != null && ` · ${Math.round(site.km)} km`}
                          </span>
                        </div>
                        <details>
                          <summary>Who may be eligible?</summary>
                          <p className="muted">
                            Registry excerpts · age: {t.minimumAge} · sex:{" "}
                            {status(t.sex)}
                          </p>
                          {["Inclusion", "Exclusion", "General"].map(
                            (g) =>
                              bullets.some((b) => b.group === g) && (
                                <div key={g}>
                                  <strong>{g}</strong>
                                  <ul>
                                    {bullets
                                      .filter((b) => b.group === g)
                                      .slice(0, 3)
                                      .map((b, i) => (
                                        <li key={i}>{b.text}</li>
                                      ))}
                                  </ul>
                                </div>
                              ),
                          )}
                          <details>
                            <summary>Original eligibility text</summary>
                            <pre>{t.eligibility || "Not supplied"}</pre>
                          </details>
                        </details>
                        <a
                          className="record-link"
                          href={"https://clinicaltrials.gov/study/" + t.id}
                          target="_blank"
                          rel="noreferrer"
                        >
                          ClinicalTrials.gov · {t.id}
                        </a>
                      </article>
                    );
                  })}
                </div>
              )}
              {filtered.length > limit && (
                <button
                  className="button secondary load-more"
                  onClick={() => setLimit((l) => l + 9)}
                >
                  Show more studies
                </button>
              )}
              <SiteMap sites={eligibleSites} />
            </SourceState>
          )}
          <Stamp state={tr} name="ClinicalTrials.gov API v2" />
        </section>
        {condition && (
          <>
            <section id="treatments" className="section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">THE TREATMENT LANDSCAPE</span>
                  <h2>Know what’s on the label.</h2>
                </div>
                <a
                  href="https://www.accessdata.fda.gov/scripts/cder/daf/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Verify FDA approvals
                </a>
              </div>
              <div className="notice compact">
                FDA application approval is checked against Drugs@FDA where
                available. A label search match does not confirm approval for
                this indication. Years refer to the original application, not
                the indication; this is a partial list. Administration
                frequency: see the original label.
              </div>
              <SourceState state={tx}>
                {!treatments.length ? (
                  <div className="notice">
                    No matching drug labels were returned. This does not mean
                    there are no approved treatments.
                  </div>
                ) : (
                  <div className="treatment-grid">
                    {treatments.map((t) => (
                      <article className="treatment-card" key={t.id}>
                        <span className="eyebrow">LABEL MATCH · {t.route}</span>
                        <h3>{t.name.toLowerCase()}</h3>
                        <p className="muted">
                          {t.approvalYear
                            ? `FDA application approved: ${t.approvalYear}`
                            : "Application approval not verified"}
                          <br />
                          Application: {t.application}
                        </p>
                        {!!t.warningTopics?.length && (
                          <div className="warning-topics">
                            <strong>Warnings mentioned in this label</strong>
                            <ul>
                              {t.warningTopics.map((w) => (
                                <li key={w}>{w}</li>
                              ))}
                            </ul>
                            <small>
                              Topic labels only; read the full warnings below.
                            </small>
                          </div>
                        )}
                        {t.approvalUrl && (
                          <a
                            className="approval-link"
                            href={t.approvalUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View FDA approval record
                          </a>
                        )}
                        <details>
                          <summary>Indication text</summary>
                          <p>{t.indication}</p>
                        </details>
                        <details>
                          <summary>Label warnings · original wording</summary>
                          <p>{t.warnings}</p>
                        </details>
                        <div className="treatment-links">
                          <a href={t.url} target="_blank" rel="noreferrer">
                            DailyMed label
                          </a>
                          <a
                            href={
                              "https://api.fda.gov/drug/label.json?search=id:" +
                              encodeURIComponent(t.id)
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            openFDA record
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </SourceState>
              <Stamp state={tx} name="openFDA labels · DailyMed links" />
            </section>
            <section id="research" className="section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">THE LATEST CHAPTER</span>
                  <h2>Fresh from the literature.</h2>
                </div>
                <span className="section-caption">
                  Published in the last 90 days
                </span>
              </div>
              <Volume condition={condition} />
              <SourceState state={rs}>
                <div className="research-heading">
                  <p>
                    <strong>{rs.data?.count ?? 0}</strong> matching PubMed
                    records · {papers.length} latest shown
                  </p>
                  <span className="muted">
                    Title/abstract search · publication date
                  </span>
                </div>
                {!papers.length ? (
                  <div className="notice">
                    No recent papers were returned for this search. Try another
                    name for the condition.
                  </div>
                ) : (
                  <div className="paper-list">
                    {papers.map((p) => (
                      <article key={p.id}>
                        <div>
                          <span>{p.journal}</span>
                          <h3>
                            <a href={p.url} target="_blank" rel="noreferrer">
                              {p.title}
                            </a>
                          </h3>
                          <small>PubMed · PMID {p.id}</small>
                        </div>
                        <div>
                          <time>{p.date}</time>
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={"Read " + p.title}
                          ></a>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </SourceState>
              <Stamp state={rs} name="NCBI PubMed E-utilities" />
            </section>
          </>
        )}
        <Imaging condition={condition} />
        <section className="closing">
          <span className="eyebrow">A LITTLE CLARITY GOES A LONG WAY</span>
          <h2>
            Better questions.
            <br />
            <em>Better understanding.</em>
          </h2>
          <p>Follow your curiosity. Keep the evidence close.</p>
          <button
            className="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              searchRef.current?.focus();
            }}
          >
            Explore a condition
          </button>
        </section>
      </main>
      <footer>
        <div>
          <a className="brand" href="/">
            Arizona<span className="footer-star">✳</span>
          </a>
          <p>A clearer view of medicine.</p>
        </div>
        <div>
          <strong>Evidence, in the open.</strong>
          <p>
            Sources: ClinicalTrials.gov · NCBI PubMed · openFDA · DailyMed ·
            MedlinePlus · NLM Clinical Tables · RadiologyInfo.
          </p>
          <p>
            For information and education only. This site does not diagnose
            disease, interpret patient scans, recommend treatment or replace
            professional medical care. Trial eligibility and availability
            require confirmation with the study team.
          </p>
          <small>
            Public data can be incomplete or delayed. Source retrieval times
            appear in each section.
          </small>
        </div>
      </footer>
    </>
  );
}
function locationGlobal() {
  return window.location;
}
function SiteMap({ sites }: { sites: Trial["sites"] }) {
  const pts = sites.filter(
    (s) => Number.isFinite(s.lat) && Number.isFinite(s.lon),
  );
  return (
    <div className="map-panel">
      <div>
        <span className="eyebrow">RESEARCH, AROUND THE WORLD</span>
        <h3>Active study locations</h3>
        <p>
          {pts.length} site entries with coordinates.
          <br />
          Repeated locations may overlap.
        </p>
      </div>
      <svg
        viewBox="0 0 720 280"
        role="img"
        aria-label="Study site coordinate plot, longitude from minus 180 to 180 and latitude from 90 to minus 90"
      >
        <rect width="720" height="280" rx="8" fill="var(--surface)" />
        {[70, 140, 210].map((y) => (
          <line key={y} x1="0" x2="720" y1={y} y2={y} stroke="var(--line)" />
        ))}
        {[120, 240, 360, 480, 600].map((x) => (
          <line key={x} x1={x} x2={x} y1="0" y2="280" stroke="var(--line)" />
        ))}
        <path
          d={worldLandPath}
          fill="var(--line)"
          stroke="var(--muted)"
          strokeWidth=".25"
          opacity=".65"
        />
        <text x="8" y="18" fill="var(--muted)" fontSize="12">
          90° N
        </text>
        <text x="8" y="268" fill="var(--muted)" fontSize="12">
          90° S
        </text>
        {pts.map((s, i) => (
          <circle
            key={i}
            cx={(s.lon! + 180) * 2}
            cy={((90 - s.lat!) * 280) / 180}
            r="3.5"
            fill="var(--accent)"
            opacity=".65"
          >
            <title>
              {s.name}, {s.city}, {s.country}
            </title>
          </circle>
        ))}
      </svg>
      <small>
        Active study sites · Natural Earth map, public domain · some sites have
        no coordinates.
      </small>
    </div>
  );
}
