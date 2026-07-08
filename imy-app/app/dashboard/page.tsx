import Link from "next/link";
import { getUser } from "@/lib/auth";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import { moderateMemory } from "@/app/dashboard/actions";
import { pronounSet } from "@/lib/renderTribute";

export const dynamic = "force-dynamic";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(user: any) {
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || "";
  if (name) return String(name).split(" ")[0];
  const email = user?.email || "";
  return email.split("@")[0] || "there";
}

function daysUntilAnniversary(diedOn: string | null) {
  if (!diedOn) return null;
  const died = new Date(diedOn + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let next = new Date(today.getFullYear(), died.getMonth(), died.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, died.getMonth(), died.getDate());
  const years = next.getFullYear() - died.getFullYear();
  const days = Math.round((next.getTime() - today.getTime()) / 86400000);
  return { years, days, dateLabel: next.toLocaleDateString("en-US", { month: "long", day: "numeric" }) };
}

export default async function DashboardHome({ searchParams }: { searchParams: { t?: string } }) {
  const user = await getUser();
  if (!user || !supabaseConfigured) {
    return (
      <section className="panel-head stagger">
        <div className="panel-kicker mono">The desk</div>
        <h1 className="panel-title">Your page will appear here</h1>
        <p className="panel-sub">Once everything is connected, this room fills up with what's waiting for you.</p>
      </section>
    );
  }

  const db = supabaseAdmin();
  const email = user.email || "";
  try {
    if (email) await db.from("tributes").update({ owner_id: user.id }).is("owner_id", null).eq("owner_email", email);
  } catch {}

  const orFilter = email ? `owner_id.eq.${user.id},owner_email.eq.${email}` : `owner_id.eq.${user.id}`;
  const { data: tributesData } = await db
    .from("tributes")
    .select("id,slug,loved_one_name,pronouns,tier,status,candle_count,flower_count,died_on,story,created_at")
    .or(orFilter)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const list = tributesData || [];

  if (list.length === 0) {
    return (
      <section className="panel-head stagger">
        <div className="panel-kicker mono">{greeting()}, {firstName(user)}</div>
        <h1 className="panel-title">
          <span className="uline drawn">There's no page here yet.</span>
        </h1>
        <p className="panel-sub">When you begin one, this room will hold everything about it — quietly, in one place.</p>
        <div className="card-grid" style={{ marginTop: 24 }}>
          <div className="s-card full liftable">
            <p className="sentence">Start a memorial page for someone you love. It takes a few minutes, and stays online, always.</p>
            <div className="card-foot">
              <Link href="/onboarding" className="btn primary">
                Begin a page
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const selected = searchParams?.t ? list.find((t: any) => t.id === searchParams.t) : null;
  const t = selected || list[0];

  const { data: photos } = await db
    .from("tribute_photos")
    .select("id")
    .eq("tribute_id", t.id)
    .is("deleted_at", null);
  const pictureCount = (photos || []).length;

  const { data: memories } = await db
    .from("tribute_memories")
    .select("id,author_name,relation,body,status,created_at")
    .eq("tribute_id", t.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const pending = (memories || []).filter((m: any) => m.status === "pending");
  const approved = (memories || []).filter((m: any) => m.status === "approved");
  const firstPending = pending[0];

  const anniv = daysUntilAnniversary(t.died_on);
  const name = t.loved_one_name || "them";
  const possessive = /s$/i.test(name.split(" ")[0] || "") ? `${name}'` : `${name}'s`;
  const pn = pronounSet(t.pronouns);

  return (
    <section className="panel-head stagger">
      <div className="panel-kicker mono">
        {greeting()}, {firstName(user)}
      </div>
      <div className="panel-title-row">
        <svg className="sprig title-sprig" viewBox="0 0 32 32">
          <path d="M16 29c0-8 0-15 0-22" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <h1 className="panel-title">
          <span className="uline drawn">Everything about {possessive} page, in one room.</span>
        </h1>
      </div>
      <p className="panel-sub">
        A quiet place to see what's waiting, what's been shared, and what still needs a decision. Nothing here is urgent tonight.
      </p>

      <div className="card-grid" style={{ marginTop: 24 }}>
        {/* Waiting count card, with the first pending memory decidable inline */}
        <div className="s-card liftable full stagger" style={{ animationDelay: ".02s" }}>
          <p className="sentence">
            {pending.length > 0 ? (
              <>
                <b>
                  {pending.length} {pending.length === 1 ? "thing is" : "things are"} waiting for you
                </b>{" "}
                — {pending.length === 1 ? "one memory" : `${pending.length} memories`} left for {name} this week.
              </>
            ) : (
              <>
                <b>Nothing is waiting for you</b> — the desk is clear for now.
              </>
            )}
          </p>

          {firstPending ? (
            <div className="inline-decide">
              <div className="id-who mono">
                Memory {"·"} {firstPending.author_name}
                {firstPending.relation ? ` · ${firstPending.relation}` : ""}
              </div>
              <p className="idq">{`"${firstPending.body}"`}</p>
              <div className="id-actions">
                <form action={moderateMemory}>
                  <input type="hidden" name="id" value={firstPending.id} />
                  <input type="hidden" name="tributeId" value={t.id} />
                  <input type="hidden" name="action" value="approve" />
                  <button type="submit" className="btn primary small">
                    Share on {pn.pos} page
                  </button>
                </form>
                <form action={moderateMemory}>
                  <input type="hidden" name="id" value={firstPending.id} />
                  <input type="hidden" name="tributeId" value={t.id} />
                  <input type="hidden" name="action" value="hide" />
                  <button type="submit" className="btn quiet small">
                    Keep for family
                  </button>
                </form>
              </div>
              {pending.length > 1 ? (
                <p className="id-rest">
                  or{" "}
                  <Link href={`/dashboard/tributes/${t.id}`}>
                    read the remaining {pending.length - 1}, one at a time
                  </Link>
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="card-foot">
            <Link href={`/dashboard/tributes/${t.id}`} className="btn quiet">
              Open the whole queue
            </Link>
          </div>
        </div>

        {/* What people remember */}
        <div className="s-card liftable stagger" style={{ animationDelay: ".06s" }}>
          <p className="sentence">
            {approved.length > 0 ? (
              <>
                People have been writing to {possessive} page. <b>{approved.length} {approved.length === 1 ? "memory has" : "memories have"}</b>{" "}
                been shared so far.
              </>
            ) : (
              <>No memories have been shared on {possessive} page yet — the first one will appear here.</>
            )}
          </p>
          <div className="card-foot">
            <Link href={`/dashboard/tributes/${t.id}`} className="btn quiet">
              See what people remember
            </Link>
          </div>
        </div>

        {/* Pictures */}
        <div className="s-card liftable stagger" style={{ animationDelay: ".1s" }}>
          <p className="sentence">
            {pictureCount > 0 ? (
              <>
                {possessive} page holds <b>{pictureCount} {pictureCount === 1 ? "picture" : "pictures"}</b> kept so far.
              </>
            ) : (
              <>No pictures kept yet — the first one becomes the cover of {possessive} page.</>
            )}
          </p>
          <div className="card-foot">
            <Link href={`/dashboard/tributes/${t.id}`} className="btn quiet">
              Open the pictures
            </Link>
          </div>
        </div>

        {/* Story */}
        <div className="s-card liftable stagger" style={{ animationDelay: ".14s", position: "relative" }}>
          <svg className="sprig corner-sprig tr" viewBox="0 0 60 60" aria-hidden="true">
            <path d="M4 56C10 40 14 24 26 8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <p className="sentence">
            {t.story ? (
              <>{possessive} story is written, and ready for you to add to, quietly, whenever you like.</>
            ) : (
              <>{possessive} story hasn't been started yet — a few lines are enough to begin.</>
            )}
          </p>
          <div className="card-foot">
            <Link href={`/dashboard/tributes/${t.id}`} className="btn quiet">
              Visit {pn.pos} story
            </Link>
          </div>
        </div>

        {/* Trusted people (static copy — no people/permissions system wired yet) */}
        <div className="s-card liftable stagger" style={{ animationDelay: ".18s" }}>
          <p className="sentence">
            Family and friends can be invited to help tend {possessive} page. <b>Trusted people</b> can share memories without waiting on you.
          </p>
          <div className="card-foot">
            <Link href={`/dashboard/tributes/${t.id}`} className="btn quiet">
              See who's caretaking
            </Link>
          </div>
        </div>

        {/* Anniversary */}
        <div className="s-card liftable stagger" style={{ animationDelay: ".22s" }}>
          <p className="sentence">
            {anniv ? (
              <>
                {anniv.dateLabel} will be <b>{anniv.years} {anniv.years === 1 ? "year" : "years"}</b> from today. There is time to decide,
                gently, whether {possessive} page should mark it.
              </>
            ) : (
              <>Once a date is added to {possessive} page, this room will help you think about the day gently.</>
            )}
          </p>
          <div className="card-foot">
            <Link href={`/dashboard/tributes/${t.id}`} className="btn quiet">
              Think about that day
            </Link>
          </div>
        </div>

        {/* Vigil band */}
        <div className="s-card full vigil-card stagger" style={{ animationDelay: ".26s" }}>
          <p className="sentence">
            <b>{t.flower_count || 0} {(t.flower_count || 0) === 1 ? "flower has" : "flowers have"} been laid</b> {"·"}{" "}
            {t.candle_count || 0} {(t.candle_count || 0) === 1 ? "candle" : "candles"} lit for {name}.
          </p>
          <div className="card-foot">
            <Link href={`/sites/${t.slug}`} target="_blank" rel="noopener noreferrer" className="btn quiet">
              See how {pn.pos} page is tended
            </Link>
          </div>
        </div>
      </div>

      <div className="leaf-divider" aria-hidden="true">
        <span className="stem-line" />
        <svg viewBox="0 0 26 16">
          <path d="M13 8c-4-3-8-3-11 0 3 3 7 3 11 0z" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <path d="M13 8c4-3 8-3 11 0-3 3-7 3-11 0z" fill="none" stroke="currentColor" strokeWidth="1.1" />
        </svg>
        <span className="stem-line" />
      </div>
    </section>
  );
}
