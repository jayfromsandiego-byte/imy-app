import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { saveTribute, moderateMemory, moderateComment } from "@/app/dashboard/actions";
import { pronounSet } from "@/lib/renderTribute";
import MediaManager from "@/components/MediaManager";

export const dynamic = "force-dynamic";

export default async function EditTribute({ params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) redirect("/signin");
  const db = supabaseAdmin();
  const { data: t } = await db.from("tributes").select("*").eq("id", params.id).maybeSingle();
  if (!t || (t.owner_id !== user.id && t.owner_email !== user.email)) {
    return (
      <section className="panel-head stagger">
        <p className="panel-sub">
          This tribute could not be found, or isn&rsquo;t yours to manage.{" "}
          <Link href="/dashboard">Back to your tributes</Link>
        </p>
      </section>
    );
  }
  const { data: memories } = await db
    .from("tribute_memories")
    .select("*")
    .eq("tribute_id", t.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const { data: photos } = await db
    .from("tribute_photos")
    .select("id,url,sort")
    .eq("tribute_id", t.id)
    .is("deleted_at", null)
    .order("sort", { ascending: true });
  const { data: comments } = await db
    .from("tribute_memory_comments")
    .select("id,memory_id,author_name,relation,body,status,created_at")
    .eq("tribute_id", t.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const photoCount = (photos || []).length;
  const pending = (memories || []).filter((m: any) => m.status === "pending");
  const approved = (memories || []).filter((m: any) => m.status === "approved");
  const pendingComments = (comments || []).filter((c: any) => c.status === "pending");
  const pn = pronounSet(t.pronouns);
  const memoryExcerpt = (memoryId: string) => {
    const m = (memories || []).find((x: any) => x.id === memoryId);
    const body = m?.body || "";
    return body.length > 90 ? `${body.slice(0, 90)}…` : body;
  };

  function timeAgo(iso: string) {
    const then = new Date(iso).getTime();
    const diffMs = Date.now() - then;
    const mins = Math.round(diffMs / 60000);
    if (mins < 60) return mins <= 1 ? "just now" : `${mins} minutes ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return hours === 1 ? "an hour ago" : `${hours} hours ago`;
    const days = Math.round(hours / 24);
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="stagger">
      <div className="panel-head">
        <Link href="/dashboard" className="mono" style={{ fontSize: 14, textDecoration: "none" }}>
          {"←"} All tributes
        </Link>
        <div className="panel-title-row" style={{ marginTop: 8 }}>
          <svg className="sprig title-sprig" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M16 29c0-8 0-15 0-22" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <h1 className="panel-title">
            <span className="uline drawn">{t.loved_one_name}</span>
          </h1>
        </div>
        <p className="panel-sub mono" style={{ fontSize: 12 }}>
          {t.slug}.imissyoumemorial.com {"·"} {t.tier} {"·"} {t.status} {"·"} {photoCount || 0} photos
        </p>
      </div>

      {/* ---------- Waiting for you — letters on the desk ---------- */}
      <section style={{ marginTop: 32 }}>
        <div className="panel-title-row">
          <h2 className="panel-title" style={{ fontSize: 20 }}>
            Waiting for you{pending.length > 0 ? ` · ${pending.length}` : ""}
          </h2>
        </div>
        <p className="panel-sub" style={{ marginBottom: 20 }}>
          Read each one before deciding. Nothing here is visible to anyone until you choose.
        </p>

        {pending.length === 0 && pendingComments.length === 0 ? (
          <div className="empty-desk">
            <p className="line1">You&rsquo;ve read everything.</p>
            <p className="line2">Nothing waits for you today.</p>
          </div>
        ) : (
          <div className="letter-stack">
            {pending.map((m: any) => (
              <article key={m.id} className="letter">
                <div className="letter-top">
                  <div className="letter-meta">
                    <span className="letter-kind mono">Memory</span>
                    <span className="letter-from">
                      {m.author_name}
                      {m.relation ? ` · ${m.relation}` : ""}
                    </span>
                  </div>
                  <span className="letter-when mono">{timeAgo(m.created_at)}</span>
                </div>
                <p className="letter-body quote">{`"${m.body}"`}</p>
                {m.audio_url ? (
                  <div style={{ margin: "6px 0 2px" }}>
                    {/* a voice came with this memory — listen before deciding */}
                    <audio controls preload="none" src={m.audio_url} style={{ width: "100%", height: 34, display: "block" }} />
                    <p className="panel-sub mono" style={{ fontSize: 12, marginTop: 4 }}>a voice came with this memory</p>
                  </div>
                ) : null}
                <div className="letter-actions">
                  <form action={moderateMemory}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="tributeId" value={t.id} />
                    <input type="hidden" name="action" value="approve" />
                    <button type="submit" className="btn primary">
                      Share on {pn.pos} page
                    </button>
                  </form>
                  <form action={moderateMemory}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="tributeId" value={t.id} />
                    <input type="hidden" name="action" value="hide" />
                    <button type="submit" className="btn quiet">
                      Keep for family
                    </button>
                  </form>
                </div>
              </article>
            ))}
            {pendingComments.map((c: any) => (
              <article key={c.id} className="letter">
                <div className="letter-top">
                  <div className="letter-meta">
                    <span className="letter-kind mono">A word</span>
                    <span className="letter-from">
                      {c.author_name}
                      {c.relation ? ` · ${c.relation}` : ""}
                    </span>
                  </div>
                  <span className="letter-when mono">{timeAgo(c.created_at)}</span>
                </div>
                <p className="letter-body quote">{`"${c.body}"`}</p>
                {memoryExcerpt(c.memory_id) ? (
                  <p className="panel-sub mono" style={{ fontSize: 12, marginTop: 6 }}>
                    left under: &ldquo;{memoryExcerpt(c.memory_id)}&rdquo;
                  </p>
                ) : null}
                <div className="letter-actions">
                  <form action={moderateComment}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="tributeId" value={t.id} />
                    <input type="hidden" name="action" value="approve" />
                    <button type="submit" className="btn primary">
                      Share on the page
                    </button>
                  </form>
                  <form action={moderateComment}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="tributeId" value={t.id} />
                    <input type="hidden" name="action" value="hide" />
                    <button type="submit" className="btn quiet">
                      Keep for family
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
        <p className="mono" style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 18 }}>
          {approved.length} {approved.length === 1 ? "memory" : "memories"} shared
        </p>
      </section>

      <div className="leaf-divider" aria-hidden="true">
        <span className="stem-line" />
        <svg viewBox="0 0 26 16">
          <path d="M13 8c-4-3-8-3-11 0 3 3 7 3 11 0z" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <path d="M13 8c4-3 8-3 11 0-3 3-7 3-11 0z" fill="none" stroke="currentColor" strokeWidth="1.1" />
        </svg>
        <span className="stem-line" />
      </div>

      {/* ---------- The pictures ---------- */}
      <section style={{ marginTop: 8 }}>
        <h2 className="panel-title" style={{ fontSize: 20, marginBottom: 6 }}>
          The pictures
        </h2>
        <p className="panel-sub" style={{ marginBottom: 20 }}>
          The first photo becomes {pn.pos} Memorial Stone and portrait.
        </p>
        <MediaManager tributeId={t.id} photos={(photos as any) || []} />
      </section>

      <div className="leaf-divider" aria-hidden="true">
        <span className="stem-line" />
        <svg viewBox="0 0 26 16">
          <path d="M13 8c-4-3-8-3-11 0 3 3 7 3 11 0z" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <path d="M13 8c4-3 8-3 11 0-3 3-7 3-11 0z" fill="none" stroke="currentColor" strokeWidth="1.1" />
        </svg>
        <span className="stem-line" />
      </div>

      {/* ---------- Their story ---------- */}
      <section style={{ marginTop: 8 }}>
        <h2 className="panel-title" style={{ fontSize: 20, marginBottom: 6 }}>
          {pn.Pos} story
        </h2>
        <p className="panel-sub" style={{ marginBottom: 20 }}>
          A few core details for {pn.pos} page. Save whenever you like — nothing here is urgent.
        </p>
        <form action={saveTribute} className="story-room">
          <input type="hidden" name="id" value={t.id} />
          <label>
            <span className="field-label">Name</span>
            <input className="field-input" name="loved_one_name" defaultValue={t.loved_one_name || ""} />
          </label>
          <div className="field-row">
            <label>
              <span className="field-label">Born</span>
              <input className="field-input" type="date" name="born_on" defaultValue={t.born_on || ""} min="1900-01-01" max={new Date().toISOString().slice(0, 10)} />
            </label>
            <label>
              <span className="field-label">Passed</span>
              <input className="field-input" type="date" name="died_on" defaultValue={t.died_on || ""} min={t.born_on || "1900-01-01"} max={new Date().toISOString().slice(0, 10)} />
            </label>
          </div>
          <label style={{ marginTop: 14, display: "block" }}>
            <span className="field-label">Where they lived</span>
            <input className="field-input" name="place" defaultValue={t.place || ""} />
          </label>
          <label style={{ marginTop: 14, display: "block" }}>
            <span className="field-label">A favourite line</span>
            <input className="field-input" name="portrait_quote" defaultValue={t.portrait_quote || ""} />
          </label>
          <label style={{ marginTop: 14, display: "block" }}>
            <span className="field-label">Their story</span>
            <textarea className="field-input" name="story" defaultValue={t.story || ""} />
          </label>
          <div className="field-row">
            <label>
              <span className="field-label">Status</span>
              <select className="field-input" name="status" defaultValue={t.status}>
                <option value="draft">Draft (hidden)</option>
                <option value="published">Published (live)</option>
              </select>
            </label>
            <label>
              <span className="field-label">Who can visit</span>
              <select className="field-input" name="visibility" defaultValue={t.visibility}>
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </label>
          </div>
          <button type="submit" className="btn primary" style={{ marginTop: 20 }}>
            Save changes
          </button>
        </form>
      </section>
    </div>
  );
}
