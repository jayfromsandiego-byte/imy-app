import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { saveTribute, moderateMemory } from "@/app/dashboard/actions";
import MediaManager from "@/components/MediaManager";

export const dynamic = "force-dynamic";
const C = { ink: "#2C2520", inkSoft: "#5A4F45", terra: "#A87C5F", line: "#E4D9C4", deep: "#F3ECDD", good: "#4F7A52", bad: "#8C2F2A" };

export default async function EditTribute({ params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) redirect("/signin");
  const db = supabaseAdmin();
  const { data: t } = await db.from("tributes").select("*").eq("id", params.id).maybeSingle();
  if (!t || (t.owner_id !== user.id && t.owner_email !== user.email)) {
    return <p style={{ color: C.inkSoft }}>This tribute could not be found, or isn't yours to manage. <a href="/dashboard" style={{ color: C.terra }}>Back to your tributes</a></p>;
  }
  const { data: memories } = await db.from("tribute_memories").select("*").eq("tribute_id", t.id).is("deleted_at", null).order("created_at", { ascending: false });
  const { data: photos } = await db.from("tribute_photos").select("id,url,sort").eq("tribute_id", t.id).is("deleted_at", null).order("sort", { ascending: true });
  const photoCount = (photos || []).length;
  const pending = (memories || []).filter((m: any) => m.status === "pending");
  const approved = (memories || []).filter((m: any) => m.status === "approved");

  const field: any = { width: "100%", fontFamily: "inherit", fontSize: 15, padding: "11px 13px", border: `1px solid ${C.line}`, borderRadius: 10, background: "#fff", marginTop: 5 };
  const lbl: any = { fontFamily: "'Sometype Mono',monospace", fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: C.inkSoft, display: "block" };

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <a href="/dashboard" style={{ color: C.terra, textDecoration: "none", fontSize: 14 }}>{"←"} All tributes</a>
        <h1 style={{ fontWeight: 700, fontSize: "1.8rem", marginTop: 8 }}>{t.loved_one_name}</h1>
        <div style={{ fontFamily: "'Sometype Mono',monospace", fontSize: 12, color: C.inkSoft, marginTop: 4 }}>
          {t.slug}.imissyoumemorial.com {"·"} {t.tier} {"·"} {t.status} {"·"} {photoCount || 0} photos
        </div>
      </div>

      <form action={saveTribute} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 22 }}>
        <input type="hidden" name="id" value={t.id} />
        <h2 style={{ fontWeight: 600, fontSize: "1.2rem", marginBottom: 14 }}>Their page</h2>
        <label style={lbl}>Name<input style={field} name="loved_one_name" defaultValue={t.loved_one_name || ""} /></label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <label style={lbl}>Born<input style={field} type="date" name="born_on" defaultValue={t.born_on || ""} /></label>
          <label style={lbl}>Passed<input style={field} type="date" name="died_on" defaultValue={t.died_on || ""} /></label>
        </div>
        <label style={{ ...lbl, marginTop: 12 }}>Where they lived<input style={field} name="place" defaultValue={t.place || ""} /></label>
        <label style={{ ...lbl, marginTop: 12 }}>A favourite line<input style={field} name="portrait_quote" defaultValue={t.portrait_quote || ""} /></label>
        <label style={{ ...lbl, marginTop: 12 }}>Their story<textarea style={{ ...field, minHeight: 140 }} name="story" defaultValue={t.story || ""} /></label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <label style={lbl}>Status<select style={field} name="status" defaultValue={t.status}><option value="draft">Draft (hidden)</option><option value="published">Published (live)</option></select></label>
          <label style={lbl}>Who can visit<select style={field} name="visibility" defaultValue={t.visibility}><option value="public">Public</option><option value="unlisted">Unlisted</option><option value="private">Private</option></select></label>
        </div>
        <button type="submit" style={{ marginTop: 18, background: C.terra, color: "#fff", border: "none", fontFamily: "inherit", fontWeight: 600, fontSize: 15, padding: "12px 26px", borderRadius: 30, cursor: "pointer" }}>Save changes</button>
      </form>

      <MediaManager tributeId={t.id} photos={(photos as any) || []} />

      <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 22 }}>
        <h2 style={{ fontWeight: 600, fontSize: "1.2rem" }}>Memories awaiting your review{pending.length > 0 ? ` · ${pending.length}` : ""}</h2>
        {pending.length === 0 ? (
          <p style={{ color: C.inkSoft, marginTop: 8 }}>Nothing waiting. New memories from visitors appear here for you to approve before they show on the page.</p>
        ) : (
          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            {pending.map((m: any) => (
              <div key={m.id} style={{ border: `1px solid ${C.line}`, borderRadius: 11, padding: "14px 16px", background: C.deep }}>
                <div style={{ fontStyle: "italic" }}>{'"' + m.body + '"'}</div>
                <div style={{ fontFamily: "'Sometype Mono',monospace", fontSize: 12, color: C.inkSoft, marginTop: 6 }}>{"—"} {m.author_name}{m.relation ? `, ${m.relation}` : ""}</div>
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <form action={moderateMemory}>
                    <input type="hidden" name="id" value={m.id} /><input type="hidden" name="tributeId" value={t.id} /><input type="hidden" name="action" value="approve" />
                    <button type="submit" style={{ background: C.good, color: "#fff", border: "none", borderRadius: 20, padding: "7px 16px", cursor: "pointer", fontFamily: "inherit" }}>Approve</button>
                  </form>
                  <form action={moderateMemory}>
                    <input type="hidden" name="id" value={m.id} /><input type="hidden" name="tributeId" value={t.id} /><input type="hidden" name="action" value="hide" />
                    <button type="submit" style={{ background: "none", color: C.bad, border: `1px solid ${C.line}`, borderRadius: 20, padding: "7px 16px", cursor: "pointer", fontFamily: "inherit" }}>Decline</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 18, fontFamily: "'Sometype Mono',monospace", fontSize: 12, color: C.inkSoft }}>{approved.length} memories shared</div>
      </div>
    </div>
  );
}
