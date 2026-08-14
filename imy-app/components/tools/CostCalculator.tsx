"use client";

import { useMemo, useState } from "react";
import { COST_ITEMS, PATH_LABELS, type CostPath } from "@/lib/seo/content/cost-data";

// The funeral and cremation cost calculators — one engine, two doors.
// House rules:
// - Every preset number is a cited national MEDIAN with its year shown.
//   These are never quotes. The family's real number is their funeral home's
//   General Price List, and the FTC Funeral Rule entitles them to it by phone.
// - The full estimate is always visible, no email needed to see it.
//   The gate only unlocks the printable estimate, after everything is shown.
// - Families can overwrite any line with the real quoted price they were given,
//   turning the median sheet into their own comparison sheet.

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function CostCalculator({ mode = "funeral" }: { mode?: "funeral" | "cremation" }) {
  const paths: CostPath[] =
    mode === "cremation"
      ? ["direct-cremation", "cremation-service"]
      : ["burial-viewing", "direct-burial", "cremation-service", "direct-cremation"];
  const [path, setPath] = useState<CostPath>(paths[0]);
  const [on, setOn] = useState<Record<string, boolean>>(() => defaults(paths[0]));
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  function defaults(p: CostPath): Record<string, boolean> {
    const d: Record<string, boolean> = {};
    for (const it of COST_ITEMS) d[it.id] = it.defaultOn.includes(p);
    return d;
  }

  function switchPath(p: CostPath) {
    setPath(p);
    setOn(defaults(p));
  }

  const rows = COST_ITEMS.filter((it) => it.offeredOn.includes(path));
  const total = useMemo(() => {
    let sum = 0;
    let unknowns = 0;
    for (const it of rows) {
      if (!on[it.id]) continue;
      const typed = amounts[it.id];
      const v = typed !== undefined && typed !== "" ? Number(typed.replace(/[^0-9.]/g, "")) : it.medianUsd;
      if (v === null || v === undefined || Number.isNaN(v)) unknowns++;
      else sum += v;
    }
    return { sum, unknowns };
  }, [rows, on, amounts]);

  const latestYear = rows.map((r) => r.year).filter(Boolean).sort().pop() || "";

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await fetch("/api/tool-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tool: mode === "cremation" ? "cremation-cost-calculator" : "funeral-cost-calculator", variant: path }),
      });
    } catch {
      /* never block the family */
    }
    setSending(false);
    setUnlocked(true);
  }

  return (
    <div className="cc-root">
      <style
        dangerouslySetInnerHTML={{
          __html: `
.cc-root{max-width:760px;}
.cc-paths{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:0 0 24px;}
.cc-path{border:1px solid rgba(44,37,32,.25);background:#fff;padding:13px 14px;text-align:left;cursor:pointer;font-family:inherit;font-size:14.5px;color:#2C2520;border-radius:2px;}
.cc-path.sel{border-color:#3f2c1a;background:#3f2c1a;color:#FAF5EC;}
.cc-path small{display:block;font-size:12px;opacity:.75;margin-top:3px;line-height:1.4;}
.cc-table{width:100%;border-collapse:collapse;background:#FDFBF6;border:1px solid rgba(44,37,32,.18);}
.cc-table td{padding:11px 12px;border-bottom:1px solid rgba(44,37,32,.1);font-size:15px;vertical-align:top;}
.cc-table td.amt{width:130px;}
.cc-table input[type=checkbox]{width:16px;height:16px;accent-color:#3f2c1a;}
.cc-table input[type=text]{width:110px;padding:7px 9px;border:1px solid rgba(44,37,32,.25);font-family:'Sometype Mono',ui-monospace,monospace;font-size:13.5px;text-align:right;background:#fff;color:#2C2520;}
.cc-item b{font-weight:600;display:block;}
.cc-item span{font-size:12.5px;color:#5F574E;display:block;margin-top:2px;max-width:46ch;}
.cc-src{font-family:'Sometype Mono',ui-monospace,monospace;font-size:10.5px;color:#8A5F43;display:block;margin-top:3px;}
.cc-total{display:flex;justify-content:space-between;align-items:baseline;background:#3f2c1a;color:#FAF5EC;padding:16px 18px;margin-top:-1px;}
.cc-total b{font-family:'Sometype Mono',ui-monospace,monospace;font-size:24px;}
.cc-total span{font-size:13px;color:rgba(250,245,236,.75);max-width:38ch;}
.cc-honest{border-left:3px solid #C9A572;padding:6px 0 6px 14px;margin:18px 0;font-size:14px;color:#5F574E;}
.cc-gate{border:1px solid rgba(44,37,32,.18);background:#F3ECDD;padding:18px;margin-top:16px;}
.cc-gate p{font-size:14.5px;color:rgba(44,37,32,.8);margin:0 0 10px;}
.cc-btn{display:inline-block;padding:11px 20px;background:#3f2c1a;color:#FAF5EC;border:none;font-family:inherit;font-size:15px;cursor:pointer;border-radius:2px;}
.cc-btn:hover{background:#241711;}
.cc-cta{margin-top:14px;padding-top:14px;border-top:1px solid rgba(44,37,32,.14);font-size:14.5px;color:rgba(44,37,32,.8);}
.cc-cta a{color:#8A5F43;text-decoration:none;border-bottom:1px solid rgba(138,95,67,.4);}
@media print{body *{visibility:hidden;} .cc-print,.cc-print *{visibility:visible;} .cc-print{position:absolute;inset:0;} .cc-gate,.cc-paths{display:none;}}
`,
        }}
      />
      <div className="cc-paths" role="group" aria-label="Choose a path">
        {paths.map((p) => (
          <button key={p} type="button" className={`cc-path${p === path ? " sel" : ""}`} onClick={() => switchPath(p)}>
            {PATH_LABELS[p].name}
            <small>{PATH_LABELS[p].blurb}</small>
          </button>
        ))}
      </div>

      <div className="cc-print">
        <table className="cc-table">
          <tbody>
            {rows.map((it) => (
              <tr key={it.id}>
                <td style={{ width: 34 }}>
                  <input
                    type="checkbox"
                    aria-label={`Include ${it.label}`}
                    checked={!!on[it.id]}
                    onChange={(e) => setOn((prev) => ({ ...prev, [it.id]: e.target.checked }))}
                  />
                </td>
                <td className="cc-item">
                  <b>{it.label}</b>
                  {it.note && <span>{it.note}</span>}
                  {it.medianUsd !== null ? (
                    <span className="cc-src">median {fmt(it.medianUsd)} · {it.sourceLabel} {it.year}</span>
                  ) : (
                    <span className="cc-src">no national median published · enter your quote</span>
                  )}
                </td>
                <td className="amt">
                  <input
                    type="text"
                    aria-label={`${it.label} amount in dollars`}
                    placeholder={it.medianUsd !== null ? String(it.medianUsd) : "your quote"}
                    value={amounts[it.id] ?? ""}
                    onChange={(e) => setAmounts((prev) => ({ ...prev, [it.id]: e.target.value }))}
                    disabled={!on[it.id]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="cc-total">
          <span>
            Estimate from national medians{latestYear ? ` (${latestYear})` : ""} and your own entries.
            Not a quote. Cemetery costs (plot, opening, marker) are separate.
            {total.unknowns > 0 ? ` ${total.unknowns} item(s) have no median and count as zero until you enter a quote.` : ""}
          </span>
          <b aria-live="polite">{fmt(total.sum)}</b>
        </div>
      </div>

      <p className="cc-honest">
        The real number is the funeral home's General Price List. The FTC Funeral Rule gives
        you the right to prices over the phone, the right to decline packages and choose item
        by item, and the right to buy a casket anywhere with no handling fee. Embalming is not
        required by federal law.
      </p>

      {!unlocked ? (
        <form className="cc-gate" onSubmit={unlock}>
          <p>The full estimate is above and stays open. Enter your email and the printable estimate sheet unlocks, itemized with sources, ready to bring to the funeral home.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="email" aria-label="Your email address" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ flex: 1, padding: "10px 12px", border: "1px solid rgba(44,37,32,.25)", fontFamily: "inherit", fontSize: 15 }} />
            <button className="cc-btn" disabled={sending} type="submit">{sending ? "One moment" : "Unlock the print sheet"}</button>
          </div>
        </form>
      ) : (
        <div className="cc-gate">
          <button className="cc-btn" type="button" onClick={() => window.print()}>Print / Save as PDF</button>
          <p className="cc-cta">
            Costs are one afternoon. Their memory is longer.{" "}
            <a href="/onboarding?from=cost-calculator">Create their memorial page</a> · free, forever.
          </p>
        </div>
      )}
    </div>
  );
}
