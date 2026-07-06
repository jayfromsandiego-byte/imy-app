"use client";
// StudySidebarChrome — client-side interactivity for the Study sidebar:
//   - the mobile hamburger drawer (<840px, matches the mock's exact breakpoint)
//   - the "Your pages" switcher drawer (when the owner has more than one tribute)
// Pure UI state; no data fetching. The server layout renders the actual
// sidebar content (identity block, nav links, plan strip) and hands the
// list of tributes to this component just for the drawer.
import { useState, type ReactNode } from "react";
import Link from "next/link";

type TributeOption = {
  id: string;
  name: string;
  meta: string;
  note: string;
  photoUrl: string | null;
  active: boolean;
};

export function MobileTopbar({ wordmark }: { wordmark: ReactNode }) {
  return (
    <div className="mobile-topbar">
      <button
        className="menu-btn"
        aria-label="Open navigation"
        onClick={() => {
          document.getElementById("study-sidebar")?.classList.add("open");
          document.getElementById("study-scrim")?.classList.add("open");
        }}
      >
        {"☰"}
      </button>
      <span className="wordmark">{wordmark}</span>
      <span style={{ width: 48 }} />
    </div>
  );
}

export function SidebarScrim() {
  return (
    <div
      className="sidebar-scrim"
      id="study-scrim"
      onClick={() => {
        document.getElementById("study-sidebar")?.classList.remove("open");
        document.getElementById("study-scrim")?.classList.remove("open");
      }}
    />
  );
}

export function PagesSwitcher({ options }: { options: TributeOption[] }) {
  const [open, setOpen] = useState(false);
  if (options.length <= 1) return null; // single-tribute owners don't need the drawer

  return (
    <>
      <button
        className="pages-btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        Your pages
        <svg className="switcher-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div className={"pages-drawer" + (open ? " open" : "")} role="dialog" aria-modal="true" aria-label="Your pages">
        <div className="pages-veil" onClick={() => setOpen(false)} />
        <div className="pages-panel">
          <div className="pages-head">
            <h2>Your pages</h2>
            <button className="drawer-close" onClick={() => setOpen(false)} aria-label="Close">
              {"×"}
            </button>
          </div>
          {options.map((o) => (
            <Link
              key={o.id}
              href={`/dashboard?t=${o.id}`}
              className={"page-option" + (o.active ? " active" : "")}
              onClick={() => setOpen(false)}
            >
              <span className="arch-portrait">
                {o.photoUrl ? (
                  <img src={o.photoUrl} alt={o.name} loading="lazy" />
                ) : (
                  <span className="initial">{o.name.charAt(0)}</span>
                )}
              </span>
              <div>
                <div className="po-name">{o.name}</div>
                <div className="po-meta mono">{o.meta}</div>
                <div className="po-note">{o.note}</div>
              </div>
            </Link>
          ))}
          <div className="drawer-foot-card">
            <b>Begin another page</b> · For families honoring more than one life.
            <br />
            Additional pages are $47 once, or $4.80 a month.
          </div>
        </div>
      </div>
    </>
  );
}
