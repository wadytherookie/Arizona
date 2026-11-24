"use client";
import { useEffect, useState } from "react";
import { Palette, Sun, Moon, Monitor, X } from "lucide-react";
import { config } from "../config/arizona";
import {
  appearanceKey,
  palette,
  validColor,
  type AppearanceSettings,
  type ThemeMode,
} from "../lib/palette";
const defaults: AppearanceSettings = {
  color: config.defaultColor,
  mode: config.defaultMode,
  coverage: config.defaultColorCoverage,
};
export default function Appearance() {
  const [open, setOpen] = useState(false),
    [settings, setSettings] = useState(defaults),
    [draft, setDraft] = useState(defaults.color.toUpperCase()),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(appearanceKey) || "null");
      if (
        saved &&
        validColor(saved.color) &&
        ["light", "dark", "system"].includes(saved.mode)
      ) {
        const next = {
          color: saved.color,
          mode: saved.mode,
          coverage: Number.isFinite(saved.coverage)
            ? Math.max(0, Math.min(100, saved.coverage))
            : 100,
        };
        setSettings(next);
        setDraft(next.color.toUpperCase());
      }
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const paint = () => {
      const dark =
        settings.mode === "dark" ||
        (settings.mode === "system" && media.matches);
      for (const [key, value] of Object.entries(
        palette(settings.color, settings.coverage, dark),
      ))
        document.documentElement.style.setProperty(key, value);
      document.documentElement.dataset.mode = dark ? "dark" : "light";
    };
    paint();
    media.addEventListener("change", paint);
    if (ready)
      try {
        localStorage.setItem(appearanceKey, JSON.stringify(settings));
      } catch {}
    return () => media.removeEventListener("change", paint);
  }, [settings, ready]);
  function changeColor(value: string) {
    setDraft(value);
    if (validColor(value)) {
      setSettings((s) => ({ ...s, color: value }));
      setError("");
    } else setError("Use a six-digit hex color, such as #F35CA6.");
  }
  function pink() {
    setSettings({
      ...defaults,
      color: "#f35ca6",
      coverage: 100,
      mode: "light",
    });
    setDraft("#F35CA6");
    setError("");
  }
  return (
    <div className="appearance-wrap">
      <button
        className="appearance-button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="appearance-panel"
      >
        <Palette size={18} /> Make it yours
      </button>
      {open && (
        <div className="appearance-panel" id="appearance-panel">
          <div className="panel-title">
            <strong>Your color. Everywhere.</strong>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close appearance"
            >
              <X size={18} />
            </button>
          </div>
          <p>Color the backgrounds, cards, buttons and details.</p>
          <button className="pink-shortcut" onClick={pink}>
            Make everything pink
          </button>
          <label className="color-row">
            <input
              type="color"
              aria-label="Choose website color"
              value={settings.color}
              onChange={(e) => changeColor(e.target.value)}
            />
            <input
              type="text"
              aria-label="Website color hex code"
              value={draft}
              onChange={(e) => changeColor(e.target.value)}
              maxLength={7}
              spellCheck={false}
            />
          </label>
          {error && <small role="status">{error}</small>}
          <label className="coverage-control">
            Color coverage <output>{settings.coverage}%</output>
            <input
              type="range"
              aria-label="Color coverage"
              min="0"
              max="100"
              value={settings.coverage}
              onChange={(e) =>
                setSettings((s) => ({ ...s, coverage: Number(e.target.value) }))
              }
            />
          </label>
          <p className="theme-help">
            Keep it subtle, or make the whole site your color. Text stays
            readable.
          </p>
          <div className="mode-options">
            {(["light", "dark", "system"] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setSettings((s) => ({ ...s, mode }))}
                aria-pressed={settings.mode === mode}
                className={settings.mode === mode ? "selected" : ""}
              >
                {mode === "light" ? (
                  <Sun size={15} />
                ) : mode === "dark" ? (
                  <Moon size={15} />
                ) : (
                  <Monitor size={15} />
                )}{" "}
                {mode === "light"
                  ? "Light"
                  : mode === "dark"
                    ? "Dark"
                    : "System"}
              </button>
            ))}
          </div>
          <button onClick={pink}>Reset to bright pink</button>
        </div>
      )}
    </div>
  );
}
