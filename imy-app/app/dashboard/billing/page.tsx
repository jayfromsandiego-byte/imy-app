import Link from "next/link";
import { getUser } from "@/lib/auth";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import ReferralCard from "./ReferralCard";

export const dynamic = "force-dynamic";
const tierLabel: Record<string, string> = { free: "Free", plus: "Plus", heirloom: "Plus", eternal: "Plus" };

function Upgrade({ tributeId, plan, label, sub }: { tributeId: string; plan: string; label: string; sub: string }) {
  return (
    <form action="/api/stripe/checkout" method="post" style={{ flex: "1 1 220px" }}>
      <input type="hidden" name="tributeId" value={tributeId} />
      <input type="hidden" name="plan" value={plan} />
      <button type="submit" className="upgrade-card">
        <div className="uc-title">{label}</div>
        <div className="uc-sub mono">{sub}</div>
      </button>
    </form>
  );
}

function Concierge() {
  return (
    <p className="panel-sub" style={{ marginTop: 14, fontSize: 14 }}>
      Want it done for you?{" "}
      <a href="mailto:hello@imissyoumemorial.com?subject=Concierge">Concierge — from $499</a>: we meet with you, build a fully
      custom tribute, produce a memorial film, and mail a printed keepsake book and framed portrait.
    </p>
  );
}

export default async function BillingPage({ searchParams }: { searchParams: { upgraded?: string; canceled?: string; error?: string } }) {
  const user = await getUser();
  if (!user || !supabaseConfigured) {
    return (
      <section className="panel-head stagger">
        <p className="panel-sub">Billing will appear here once everything is connected.</p>
      </section>
    );
  }
  const db = supabaseAdmin();
  const email = user.email || "";
  const orFilter = email ? `owner_id.eq.${user.id},owner_email.eq.${email}` : `owner_id.eq.${user.id}`;
  const { data: tributes } = await db
    .from("tributes")
    .select("id,slug,loved_one_name,tier")
    .or(orFilter)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const list = tributes || [];

  const { data: subs } = list.length
    ? await db
        .from("subscriptions")
        .select("tribute_id,status")
        .in(
          "tribute_id",
          list.map((t: any) => t.id)
        )
    : { data: [] as any[] };
  const subByTribute = new Map((subs || []).map((s: any) => [s.tribute_id, s]));

  return (
    <div className="stagger">
      <div className="panel-head">
        <Link href="/dashboard" className="mono" style={{ fontSize: 14, textDecoration: "none" }}>
          {"←"} Dashboard
        </Link>
        <div className="panel-title-row" style={{ marginTop: 8 }}>
          <svg className="sprig title-sprig" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M16 29c0-8 0-15 0-22" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <h1 className="panel-title">
            <span className="uline drawn">Billing</span>
          </h1>
        </div>
        <p className="panel-sub">
          Plus is a one-time $97 (or $12/month, with a 3-day free trial). Every page stays online no matter what — we never charge
          a family to keep a memory.
        </p>
      </div>

      {searchParams.upgraded ? (
        <p className="plan-card" style={{ marginTop: 4, marginBottom: 20 }}>
          Thank you. Your upgrade is being applied — it can take a moment to appear.
        </p>
      ) : null}
      {searchParams.error ? (
        <p className="plan-card" style={{ marginTop: 4, marginBottom: 20, borderColor: "rgba(140,47,42,.4)" }}>
          Something went wrong starting checkout ({searchParams.error}). Please try again.
        </p>
      ) : null}

      <div style={{ display: "grid", gap: 20 }}>
        {list.map((t: any) => {
          const paid = t.tier === "plus" || t.tier === "heirloom" || t.tier === "eternal";
          const sub = subByTribute.get(t.id) as any;
          const trialing = sub?.status === "trialing";
          return (
            <div key={t.id} className="s-card" style={{ display: "block" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{t.loved_one_name}</div>
                <div className="mono" style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  Current: {tierLabel[t.tier] || t.tier}
                </div>
              </div>

              {trialing ? (
                <div className="trial-banner" style={{ marginTop: 14 }}>
                  <b>This trial ends soon</b> — it becomes $12/month unless you cancel before it ends.
                </div>
              ) : null}

              {paid ? (
                <>
                  <p className="panel-sub" style={{ marginTop: 14 }}>
                    They&rsquo;re on Plus — everything is unlocked. Thank you.
                  </p>
                  <Concierge />
                </>
              ) : (
                <>
                  <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                    <Upgrade tributeId={t.id} plan="plus_once" label="Everything · Plus" sub="$97 once" />
                    <Upgrade tributeId={t.id} plan="plus_monthly" label="Everything · monthly" sub="3 days free, then $12/month" />
                  </div>
                  <Concierge />
                </>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24 }}>
        <ReferralCard />
      </div>

      <form action="/api/stripe/portal" method="post" style={{ marginTop: 24 }}>
        <button type="submit" className="btn quiet">
          Manage billing & receipts
        </button>
      </form>
    </div>
  );
}
