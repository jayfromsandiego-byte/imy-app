"use client";
// A11yBar — the warm accessibility pill row (bottom-left of the Study shell).
// Controls: A- / A / A+ (three text-size steps), high contrast, pause motion.
// State is applied as classes on <html> / <body> so study.css and any nested
// component can react to it, and persisted to localStorage so it survives
// navigation and reloads across the whole dashboard.
import { useEffect, useState } from "react";

const SCALE_KEY = "study.textScale";
const HC_KEY = "study.highContrast";
const MOTION_KEY = "study.motionPaused";

const SCALES = [
  { value: "0.92", label: "A-", title: "Smaller text" },
  { value: "1", label: "A", title: "Default text size" },
  { value: "1.16", label: "A+", title: "Larger text" },
];

export default function A11yBar() {
  const [scale, setScale] = useState("1");
  const [hc, setHc] = useState(false);
  const [paused, setPaused] = useState(false);

  // Hydrate from localStorage once on mount, then reflect onto <html>/<body>.
  useEffect(() => {
    try {
      const s = localStorage.getItem(SCALE_KEY);
      const h = localStorage.getItem(HC_KEY) === "1";
      const m = localStorage.getItem(MOTION_KEY) === "1";
      if (s) setScale(s);
      setHc(h);
      setPaused(m);
      document.documentElement.style.setProperty("--text-scale", s || "1");
      document.documentElement.classList.toggle("study-hc", h);
      document.body.classList.toggle("study-motion-paused", m);
    } catch {
      /* localStorage unavailable — controls still work for this session */
    }
  }, []);

  function applyScale(value: string) {
    setScale(value);
    document.documentElement.style.setProperty("--text-scale", value);
    try { localStorage.setItem(SCALE_KEY, value); } catch {}
  }

  function applyHc(next: boolean) {
    setHc(next);
    document.documentElement.classList.toggle("study-hc", next);
    try { localStorage.setItem(HC_KEY, next ? "1" : "0"); } catch {}
  }

  function applyPaused(next: boolean) {
    setPaused(next);
    document.body.classList.toggle("study-motion-paused", next);
    try { localStorage.setItem(MOTION_KEY, next ? "1" : "0"); } catch {}
  }

  return (
    <div className="a11y-corner" aria-label="Accessibility controls">
      {SCALES.map((s) => (
        <button
          key={s.value}
          type="button"
          className={"a11y-btn" + (scale === s.value ? " active" : "")}
          onClick={() => applyScale(s.value)}
          aria-label={s.title}
          aria-pressed={scale === s.value}
        >
          {s.label}
        </button>
      ))}
      <button
        type="button"
        className={"a11y-btn" + (hc ? " active" : "")}
        onClick={() => applyHc(!hc)}
        aria-label="Toggle high contrast"
        aria-pressed={hc}
      >
        HC
      </button>
      <button
        type="button"
        className={"a11y-btn" + (paused ? " active" : "")}
        onClick={() => applyPaused(!paused)}
        aria-label="Pause motion"
        aria-pressed={paused}
      >
        {"⏸"}
      </button>
    </div>
  );
}
