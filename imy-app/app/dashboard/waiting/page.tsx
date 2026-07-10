// /dashboard/waiting · the approval queue, and only the approval queue.
// Every visitor submission across every page the family keeps lands here as
// pending. Nothing appears on a live tribute until it is welcomed in; declined
// words are kept in Supabase, never hard-deleted. The sidebar badge and this
// page count the same things, always.
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { moderateMemory, moderateComment } from "@/app/dashboard/actions";
import { pronounSet } from "@/lib/renderTribute";

export const dynamic = "force-dynamic";

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return hours === 1 ? "an hour ago" : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function WaitingPage() {
  const user = await getUser();
  if (!user) redirect("/signin");
  const db = supabaseAdmin();

  const { data: tributes } = await db
    .from("tributes")
    .select("id,slug,loved_one_name,pronouns")
    .or(`owner_id.eq.${user.id},owner_email.eq.${user.email}`)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  const list = tributes || [];
  const ids = list.map((t: any) => t.id);

  let memories: any[] = [];
  let comments: any[] = [];
  if (ids.length) {
    const [{ data: mems }, { data: cms }] = await Promise.all([
      db.from("tribute_memories").select("*").in("tribute_id", ids).eq("status", "pending").is("deleted_at", null).order("created_at", { ascending: false }),
      db.from("tribute_memory_comments").select("*").in("tribute_id", ids).eq("status", "pending").is("deleted_at", null).order("created_at", { ascending: false }),
    ]);
    memories = mems || [];
    comments = cms || [];
  }
  const total = memories.length + comments.length;
  const byId = new Map(list.map((t: any) => [t.id, t]));

  const letter = (item: any, kind: "Memory" | "A word") => {
    const t: any = byId.get(item.tribute_id);
    const pn = pronounSet(t?.pronouns);
    return (
      <article key={`${kind}-${item.id}`} className="letter">
        <div className="letter-top">
          <div className="letter-meta">
            <span className="letter-kind mono">{kind}{t ? ` · for ${t.loved_one_name}` : ""}</span>
            <span className="letter-from">
              {item.author_name}
              {item.relation ? ` · ${item.relation}` : ""}
            </span>
            {item.author_email ? (
              <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
                {item.author_email} · kept private to you
              </span>
            ) : null}
          </div>
          <span className="letter-when mono">{timeAgo(item.created_at)}</span>
        </div>
        <p className="letter-body quote">{`"${item.body}"`}</p>
        {item.photo_url ? (
          <div style={{ margin: "8px 0 4px" }}>
            <img src={item.photo_url} alt="" style={{ maxWidth: 220, maxHeight: 160, borderRadius: 9, border: "1px solid var(--line)", display: "block" }} />
            <p className="panel-sub mono" style={{ fontSize: 12, marginTop: 4 }}>a photograph came with this memory</p>
          </div>
        ) : null}
        {item.audio_url ? (
          <div style={{ margin: "6px 0 2px" }}>
            <audio controls preload="none" src={item.audio_url} style={{ width: "100%", height: 34, display: "block" }} />
            <p className="panel-sub mono" style={{ fontSize: 12, marginTop: 4 }}>a voice came with this memory</p>
          </div>
        ) : null}
        <div className="letter-actions">
          <form action={kind === "Memory" ? moderateMemory : moderateComment}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="tributeId" value={item.tribute_id} />
            <input type="hidden" name="action" value="approve" />
            <button type="submit" className="btn primary">Approve · share on {pn.pos} page</button>
          </form>
          <form action={kind === "Memory" ? moderateMemory : moderateComment}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="tributeId" value={item.tribute_id} />
            <input type="hidden" name="action" value="hide" />
            <button type="submit" className="btn quiet">Decline · keep for family</button>
          </form>
        </div>
      </article>
    );
  };

  return (
    <div className="stagger">
      <div className="panel-head">
        <div className="panel-title-row">
          <h1 className="panel-title">
            <span className="uline drawn">Waiting for you{total ? ` · ${total}` : ""}</span>
          </h1>
        </div>
        <p className="panel-sub">
          Every memory, word, photograph, and voice lands here first. Nothing appears
          on a page until you welcome it in. Declined words are kept, never lost.
        </p>
      </div>

      <section style={{ marginTop: 28 }}>
        {total === 0 ? (
          <div className="empty-desk">
            <p className="line1">You&rsquo;ve read everything.</p>
            <p className="line2">Nothing waits for you today.</p>
          </div>
        ) : (
          <div className="letter-stack">
            {memories.map((m) => letter(m, "Memory"))}
            {comments.map((c) => letter(c, "A word"))}
          </div>
        )}
        <p className="mono" style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 18 }}>
          <Link href="/dashboard">Back to the overview</Link>
        </p>
      </section>
    </div>
  );
}
