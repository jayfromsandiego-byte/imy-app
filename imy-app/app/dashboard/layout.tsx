import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import A11yBar from "./_components/A11yBar";
import { MobileTopbar, SidebarScrim, PagesSwitcher } from "./_components/StudySidebarChrome";
import "./study.css";

export const dynamic = "force-dynamic";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Besley:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700&family=Sometype+Mono:wght@400;500;700&family=Caveat:wght@600;700&display=swap";

function fmtDates(bornOn: string | null, diedOn: string | null) {
  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
  if (bornOn && diedOn) return `${fmt(bornOn)} – ${fmt(diedOn)}`;
  if (diedOn) return fmt(diedOn);
  return "";
}

const Wordmark = () => (
  <span className="wordmark">
    I <em>Miss</em> You Memorial
  </span>
);

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/signin?next=/dashboard");

  let tributes: any[] = [];
  if (supabaseConfigured) {
    const db = supabaseAdmin();
    const email = user.email || "";
    try {
      if (email) await db.from("tributes").update({ owner_id: user.id }).is("owner_id", null).eq("owner_email", email);
    } catch {}
    const orFilter = email ? `owner_id.eq.${user.id},owner_email.eq.${email}` : `owner_id.eq.${user.id}`;
    const { data } = await db
      .from("tributes")
      .select("id,slug,loved_one_name,born_on,died_on,tier,status,candle_count,created_at")
      .or(orFilter)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    tributes = data || [];
  }

  const first = tributes[0];

  // Cover photo for the identity block: first photo of the first tribute, if any.
  let coverUrl: string | null = null;
  if (supabaseConfigured && first) {
    const db = supabaseAdmin();
    const { data: photo } = await db
      .from("tribute_photos")
      .select("url")
      .eq("tribute_id", first.id)
      .is("deleted_at", null)
      .order("sort", { ascending: true })
      .limit(1)
      .maybeSingle();
    coverUrl = photo?.url || null;
  }

  // Badge count: total pending memories across every tribute the owner has.
  let pendingTotal = 0;
  if (supabaseConfigured && tributes.length) {
    const db = supabaseAdmin();
    const { count } = await db
      .from("tribute_memories")
      .select("id", { count: "exact", head: true })
      .in(
        "tribute_id",
        tributes.map((t) => t.id)
      )
      .eq("status", "pending")
      .is("deleted_at", null);
    pendingTotal = count || 0;
  }

  const pageOptions = tributes.map((t, i) => ({
    id: t.id,
    name: t.loved_one_name || "Untitled",
    meta: fmtDates(t.born_on, t.died_on) || (t.tier ? t.tier : ""),
    note: i === 0 ? "Your first page" : "",
    photoUrl: i === 0 ? coverUrl : null,
    active: i === 0,
  }));

  const NavItem = ({ href, label, icon, count }: { href: string; label: string; icon: ReactNode; count?: number }) => (
    <Link href={href} className="nav-item">
      <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}>
        {icon}
      </svg>
      <span className="label">{label}</span>
      {typeof count === "number" && count > 0 ? <span className="count mono">{count}</span> : null}
    </Link>
  );

  return (
    <div className="study">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href={FONT_HREF} rel="stylesheet" />

      <MobileTopbar wordmark={<Wordmark />} />
      <SidebarScrim />

      <div className="shell">
        <aside className="sidebar" id="study-sidebar">
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <Wordmark />
          </Link>

          {first ? (
            <div className="identity-block">
              <span className="arch-portrait">
                {coverUrl ? (
                  <img src={coverUrl} alt={first.loved_one_name || ""} loading="lazy" />
                ) : (
                  <span className="initial">{(first.loved_one_name || "?").charAt(0)}</span>
                )}
              </span>
              <div className="name">{first.loved_one_name}</div>
              <div className="dates mono">{fmtDates(first.born_on, first.died_on)}</div>
              <PagesSwitcher options={pageOptions} />
            </div>
          ) : (
            <div className="identity-block">
              <span className="arch-portrait">
                <span className="initial">?</span>
              </span>
              <div className="name">No page yet</div>
              <div className="dates mono">START ONE BELOW</div>
            </div>
          )}

          {first ? (
            <a className="see-page-link mono" href={`/sites/${first.slug}`} target="_blank" rel="noopener noreferrer">
              See her page {"→"}
            </a>
          ) : null}

          <nav className="shelf" aria-label="Dashboard sections">
            <div className="shelf-label mono">The desk</div>
            <NavItem href="/dashboard" label="Overview" icon={<path d="M4 12L12 5l8 7M6 10v9h12v-9" />} />
            <NavItem
              href={first ? `/dashboard/tributes/${first.id}` : "/dashboard"}
              label="Waiting for you"
              count={pendingTotal}
              icon={
                <>
                  <rect x="4" y="5" width="16" height="14" rx="2" />
                  <path d="M4 8l8 6 8-6" />
                </>
              }
            />
            <NavItem
              href={first ? `/dashboard/tributes/${first.id}` : "/dashboard"}
              label="The pictures"
              icon={
                <>
                  <rect x="3" y="4" width="18" height="15" rx="2" />
                  <circle cx="8.5" cy="9.5" r="1.6" />
                  <path d="M21 16l-5.5-5.5L9 17" />
                </>
              }
            />
            <div className="shelf-label mono">The household</div>
            <NavItem
              href="/dashboard/billing"
              label="Billing"
              icon={
                <>
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M12 7v5l3.5 2" />
                </>
              }
            />
            <NavItem
              href="/dashboard"
              label="Settings"
              icon={
                <>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 13.5a7.6 7.6 0 000-3l1.9-1.5-2-3.4-2.3.6a7.4 7.4 0 00-2.6-1.5L14 2h-4l-.4 2.7a7.4 7.4 0 00-2.6 1.5l-2.3-.6-2 3.4L4.6 10.5a7.6 7.6 0 000 3L2.7 15l2 3.4 2.3-.6c.75.66 1.63 1.17 2.6 1.5L10 22h4l.4-2.7a7.4 7.4 0 002.6-1.5l2.3.6 2-3.4z" />
                </>
              }
            />
          </nav>

          <div className="sidebar-foot">
            <div className="plan-strip mono">
              {first ? (
                <>
                  {first.tier === "free" || !first.tier ? "Free plan" : "Plus plan"} {"·"} her page stays online, <b>always</b>
                </>
              ) : (
                "her page stays online, always"
              )}
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="nav-item"
                style={{ justifyContent: "flex-start" }}
              >
                <span className="label">Sign out</span>
              </button>
            </form>
          </div>
        </aside>

        <main>{children}</main>
      </div>

      <A11yBar />
      <div className="var-tag mono">I MISS YOU MEMORIAL {"·"} {user.email}</div>
    </div>
  );
}
