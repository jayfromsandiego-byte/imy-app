// lib/film.ts — Their film: the queue, the private preview, the family's yes.
//
// The film-worker (film-worker/) weaves; this file only queues jobs, reads
// their state, and — on the family's word alone — places the finished film
// on the tape shelf as a tribute_videos row (kind "film", sort 999: it joins
// the shelf but never becomes the Stone's living portrait, and never steals
// a Living picture pairing). Nothing here is ever hard-deleted; a replaced
// film rests with deleted_at while its MP4 stays in storage.
import { supabaseAdmin } from "./supabaseServer";
import { pronounSet } from "./renderTribute";

export type FilmJob = {
  id: string;
  tribute_id: string;
  variant: "auto" | "full" | "teaser";
  status: "queued" | "rendering" | "ready" | "approved" | "failed" | "superseded";
  error: string | null;
  film_url: string | null;
  poster_url: string | null;
  duration_seconds: number | null;
  rendered_variant: string | null;
  video_id: string | null;
  approve_token: string;
  created_at: string;
  finished_at: string | null;
  approved_at: string | null;
};

/** Queue a weave. One loom per tribute: an active job means we simply wait. */
export async function enqueueFilm(
  tributeId: string,
  requestedBy: "intake" | "keeper" | "ops",
  variant: "auto" | "full" | "teaser" = "auto"
): Promise<{ ok: boolean; already?: boolean }> {
  const db = supabaseAdmin();
  const { data: active } = await db
    .from("film_jobs")
    .select("id")
    .eq("tribute_id", tributeId)
    .in("status", ["queued", "rendering"])
    .is("deleted_at", null)
    .limit(1);
  if (active && active.length) return { ok: true, already: true };
  const { error } = await db
    .from("film_jobs")
    .insert({ tribute_id: tributeId, variant, requested_by: requestedBy });
  return { ok: !error };
}

/**
 * The film room's read: a token from any of this tribute's jobs unlocks the
 * latest weave (so an older emailed link still opens the room after a re-weave).
 */
export async function filmRoom(slug: string, token: string) {
  if (!slug || !token) return null;
  const db = supabaseAdmin();
  const { data: t } = await db
    .from("tributes")
    .select("id,slug,loved_one_name,pronouns,tier,deleted_at")
    .eq("slug", slug)
    .maybeSingle();
  if (!t || t.deleted_at) return null;
  const { data: keyJob } = await db
    .from("film_jobs")
    .select("id")
    .eq("tribute_id", t.id)
    .eq("approve_token", token)
    .is("deleted_at", null)
    .limit(1);
  if (!keyJob || !keyJob.length) return null;
  const { data: jobs } = await db
    .from("film_jobs")
    .select("*")
    .eq("tribute_id", t.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(8);
  const latest =
    (jobs || []).find((j) => ["queued", "rendering", "ready"].includes(j.status)) ||
    (jobs || []).find((j) => j.status === "approved") ||
    (jobs || [])[0] ||
    null;
  if (!latest) return null;
  return { tribute: t, job: latest as FilmJob };
}

/** The family's yes: place the film on the shelf. Token-gated, idempotent. */
export async function approveFilm(
  jobId: string,
  token: string
): Promise<{ ok: boolean; error?: string; slug?: string }> {
  const db = supabaseAdmin();
  const { data: job } = await db
    .from("film_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("approve_token", token)
    .is("deleted_at", null)
    .maybeSingle();
  if (!job) return { ok: false, error: "not_found" };
  const { data: t } = await db
    .from("tributes")
    .select("id,slug,pronouns")
    .eq("id", job.tribute_id)
    .maybeSingle();
  if (!t) return { ok: false, error: "not_found" };
  if (job.status === "approved") return { ok: true, slug: t.slug };
  if (job.status !== "ready" || !job.film_url) return { ok: false, error: "not_ready", slug: t.slug };

  // the previous approved film rests — one film on the shelf at a time
  const { data: olds } = await db
    .from("film_jobs")
    .select("id,video_id")
    .eq("tribute_id", job.tribute_id)
    .eq("status", "approved")
    .is("deleted_at", null);
  for (const o of olds || []) {
    if (o.video_id) {
      await db
        .from("tribute_videos")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", o.video_id);
    }
    await db.from("film_jobs").update({ status: "superseded" }).eq("id", o.id);
  }

  const pos = pronounSet(t.pronouns || undefined).pos;
  const { data: vid, error } = await db
    .from("tribute_videos")
    .insert({
      tribute_id: job.tribute_id,
      url: job.film_url,
      caption: `The film of ${pos} life`,
      sort: 999,
      kind: "film",
    })
    .select("id")
    .single();
  if (error || !vid) return { ok: false, error: "could_not_place", slug: t.slug };

  await db
    .from("film_jobs")
    .update({ status: "approved", approved_at: new Date().toISOString(), video_id: vid.id })
    .eq("id", job.id);
  return { ok: true, slug: t.slug };
}
