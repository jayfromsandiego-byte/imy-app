import { getUser } from "@/lib/auth";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
const C = { ink: "#2C2520", inkSoft: "#5A4F45", terra: "#A87C5F", gold: "#C9A572", line: "#E4D9C4", deep: "#F3ECDD" };
const tierLabel: Record<string, string> = { free: "Free", plus: "Plus", heirloom: "Heirloom" };

function Upgrade({ tributeId, plan, label, sub }: { tributeId: string; plan: string; label: string; sub: string }) {
  return (
    <form action="/api/stripe/checkout" method="post" style={{ flex: "1 1 180px" }}>
      <input type="hidden" name="tributeId" value={tributeId} />
      <input type="hidden" name="plan" value={plan} />
      <button type="submit" style={{ width: "100%", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
        <div style={{ fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 12, color: C.inkSoft, fontFamily: "'Sometype Mono',monospace", marginTop: 3 }}>{sub}</div>
      </button>
    </form>
  );
}

export default async function BillingPage({ searchParams }: { searchParams: { upgraded?: string; canceled?: string; error?: string } }) {
  const user = await getUser();
  if (!user || !supabaseConfigured) return <p style={{ color: C.inkSoft }}>Billing will appear here once everything is connected.</p>;
  const db = supabaseAdmin();
  const email = user.email || "";
  const orFilter = email ? `owner_id.eq.${user.id},owner_email.eq.${email}` : `owner_id.eq.${user.id}`;
  const { data: tributes } = await db.from("tributes").select("id,slug,loved_one_name,tier").or(orFilter).is("deleted_at", null).order("created_at", { ascending: false });
  const list = tributes || [];

  return (
    <div>
      <a href="/dashboard" style={{ color: C.terra, textDecoration: "none", fontSize: 14 }}>{"←"} Dashboard</a>
      <h1 style={{ fontWeight: 700, fontSize: "1.9rem", marginTop: 8 }}>Plans & billing</h1>
      {searchParams.upgraded ? <p style={{ background: "#E7EEE2", border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px", marginTop: 14 }}>Thank you. Your upgrade is being applied — it can take a moment to appear.</p> : null}
      {searchParams.error ? <p style={{ background: "#F3E0DC", border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px", marginTop: 14 }}>Something went wrong starting checkout ({searchParams.error}). Please try again.</p> : null}

      <p style={{ color: C.inkSoft, margin: "16px 0 6px" }}>One-time, never a recurring worry. Your tribute stays online no matter what.</p>

      <div style={{ display: "grid", gap: 16, marginTop: 14 }}>
        {list.map((t: any) => (
          <div key={t.id} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontWeight: 600, fontSize: "1.2rem" }}>{t.loved_one_name}</div>
              <div style={{ fontFamily: "'Sometype Mono',monospace", fontSize: 12, color: C.inkSoft }}>Current: {tierLabel[t.tier] || t.tier}</div>
            </div>
            {t.tier === "heirloom" ? (
              <p style={{ color: C.inkSoft, marginTop: 12 }}>They're on Heirloom — kept for generations. Thank you.</p>
            ) : (
              <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
                {t.tier !== "plus" ? <Upgrade tributeId={t.id} plan="plus_once" label="Everything · Plus" sub="$79 once" /> : null}
                {t.tier !== "plus" ? <Upgrade tributeId={t.id} plan="plus_monthly" label="Everything · monthly" sub="$7 / month" /> : null}
                <Upgrade tributeId={t.id} plan="heirloom" label="Heirloom" sub="$200 once · for generations" />
                <Upgrade tributeId={t.id} plan="book" label="Keepsake book" sub="$99 · printed & mailed" />
              </div>
            )}
          </div>
        ))}
      </div>

      <form action="/api/stripe/portal" method="post" style={{ marginTop: 22 }}>
        <button type="submit" style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 20, padding: "9px 18px", cursor: "pointer", fontFamily: "inherit", color: C.ink }}>Manage billing & receipts</button>
      </form>
    </div>
  );
}
