import Link from "next/link";
import { getUser } from "@/lib/auth";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import CopyLink from "@/components/CopyLink";

export const dynamic = "force-dynamic";
const C = { ink: "#2C2520", inkSoft: "#5A4F45", terra: "#A87C5F", line: "#E4D9C4" };
const tierLabel: Record<string, string> = { free: "Free", plus: "Plus", heirloom: "Plus", eternal: "Plus" };

export default async function DashboardHome() {
  const user = await getUser();
  if (!user || !supabaseConfigured) {
    return <p style={{ color: C.inkSoft }}>Your tributes will appear here once everything is connected.</p>;
  }
  const db = supabaseAdmin();
  const email = user.email || "";
  // Claim any guest-created tributes that match this email.
  try { if (email) await db.from("tributes").update({ owner_id: user.id }).is("owner_id", null).eq("owner_email", email); } catch {}

  const orFilter = email ? `owner_id.eq.${user.id},owner_email.eq.${email}` : `owner_id.eq.${user.id}`;
  const { data: tributes } = await db
    .from("tributes")
    .select("id,slug,loved_one_name,tier,status,candle_count,created_at")
    .or(orFilter)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const list = tributes || [];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontWeight: 700, fontSize: "1.9rem" }}>Your tributes</h1>
        <a href="/onboarding" style={{ background: C.terra, color: "#fff", textDecoration: "none", fontWeight: 600, padding: "11px 20px", borderRadius: 30 }}>Create a tribute</a>
      </div>
      {list.length === 0 ? (
        <p style={{ color: C.inkSoft, marginTop: 18 }}>You haven&rsquo;t created a tribute yet. When you do, it will appear here to manage and edit.</p>
      ) : (
        <div style={{ marginTop: 22, display: "grid", gap: 14 }}>
          {list.map((t: any) => (
            <div key={t.id} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>{t.loved_one_name}</div>
                <div style={{ fontFamily: "'Sometype Mono',monospace", fontSize: 12, color: C.inkSoft, marginTop: 3 }}>
                  {t.slug}.imissyoumemorial.com {"·"} {tierLabel[t.tier] || t.tier} {"·"} {t.status} {"·"} {t.candle_count} candles
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <CopyLink url={`https://${t.slug}.imissyoumemorial.com`} />
                <a href={`/sites/${t.slug}`} target="_blank" rel="noopener noreferrer" style={{ border: `1px solid ${C.line}`, borderRadius: 20, padding: "8px 14px", textDecoration: "none", color: C.ink }}>View</a>
                <Link href={`/dashboard/tributes/${t.id}`} style={{ background: C.terra, color: "#fff", borderRadius: 20, padding: "8px 16px", textDecoration: "none" }}>Manage</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
