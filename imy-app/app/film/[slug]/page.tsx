// app/film/[slug] — the film room. Private, token-gated, quiet.
//
// The family arrives here from one letter. They watch the film first, alone.
// It appears on the memorial only when they press yes — the same promise the
// memory wall keeps. No countdowns, no urgency, nothing is pushed.
import { filmRoom } from "@/lib/film";
import { pronounSet } from "@/lib/renderTribute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "The film room",
  robots: { index: false, follow: false },
};

const S = {
  cream: "#FAF5EC",
  creamDeep: "#F3ECDD",
  ink: "#2C2520",
  inkSoft: "#6E6156",
  terra: "#A87C5F",
  gold: "#C9A572",
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: S.cream, color: S.ink, fontFamily: "'Besley', Georgia, serif", minHeight: "100vh" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Besley:ital,wght@0,400..900;1,400..900&family=Sometype+Mono:wght@400..700&display=swap"
        rel="stylesheet"
      />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 22px 80px" }}>
        <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 38 }}>
          I <em style={{ color: S.terra, fontStyle: "italic" }}>Miss</em> You Memorial
        </div>
        {children}
        <div
          style={{
            marginTop: 46,
            fontFamily: "'Sometype Mono', monospace",
            fontSize: 11.5,
            letterSpacing: ".06em",
            color: "#8a7f70",
            lineHeight: 1.7,
          }}
        >
          Every page stays online. We never charge a family to keep a memory alive.
        </div>
      </div>
    </div>
  );
}

const eyebrow: React.CSSProperties = {
  fontFamily: "'Sometype Mono', monospace",
  fontSize: 12.5,
  letterSpacing: ".22em",
  color: S.terra,
  textTransform: "uppercase",
  marginBottom: 10,
};

const button: React.CSSProperties = {
  background: S.terra,
  color: "#fff",
  border: 0,
  borderRadius: 26,
  padding: "13px 30px",
  fontFamily: "'Besley', Georgia, serif",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
};

const quietButton: React.CSSProperties = {
  background: "transparent",
  color: S.ink,
  border: `1px solid ${S.gold}`,
  borderRadius: 26,
  padding: "12px 26px",
  fontFamily: "'Besley', Georgia, serif",
  fontSize: 15,
  cursor: "pointer",
};

export default async function FilmRoom({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { t?: string; approved?: string; removed?: string };
}) {
  const token = searchParams.t || "";
  const room = await filmRoom(params.slug, token);

  if (!room) {
    return (
      <Shell>
        <div style={eyebrow}>The film room</div>
        <h1 style={{ fontSize: 34, margin: "0 0 14px" }}>This door needs its key.</h1>
        <p style={{ fontSize: 17, lineHeight: 1.65, color: S.inkSoft, maxWidth: 560 }}>
          The link in your email opens this room. If it has gone missing, write to us at
          hello@imissyoumemorial.com and we will send it again.
        </p>
      </Shell>
    );
  }

  const { tribute, job } = room;
  const first = (tribute.loved_one_name || "").trim().split(/\s+/)[0] || "them";
  const pn = pronounSet(tribute.pronouns || undefined);
  const isPlus = tribute.tier === "plus" || tribute.tier === "heirloom";
  const isTeaser = (job.rendered_variant || job.variant) === "teaser";
  const justApproved = searchParams.approved === "1";
  const justRemoved = searchParams.removed === "1";

  return (
    <Shell>
      <div style={eyebrow}>The film room · {tribute.loved_one_name}</div>

      {(job.status === "queued" || job.status === "rendering") && (
        <>
          <h1 style={{ fontSize: 34, margin: "0 0 14px" }}>The film is being woven.</h1>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: S.inkSoft, maxWidth: 560 }}>
            {first}&rsquo;s photographs and your words are becoming a short film. It usually takes
            less than an hour. This page will hold it when it is ready — we will also write to you.
          </p>
        </>
      )}

      {job.status === "failed" && (
        <>
          <h1 style={{ fontSize: 34, margin: "0 0 14px" }}>Not yet, gently.</h1>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: S.inkSoft, maxWidth: 560 }}>
            {job.error === "not-enough-photos"
              ? `When a few more photographs have been added to ${first}'s page, the film will be ready to weave.`
              : "The weave did not finish this time. We have been told, and we will tend to it."}
          </p>
          {job.error === "not-enough-photos" && (
            <form method="post" action={`/api/tribute/${encodeURIComponent(tribute.slug)}/film`} style={{ marginTop: 22 }}>
              <input type="hidden" name="t" value={token} />
              <button type="submit" style={quietButton}>Try the weave again</button>
            </form>
          )}
        </>
      )}

      {(job.status === "ready" || job.status === "approved") && job.film_url && (
        <>
          <h1 style={{ fontSize: 34, margin: "0 0 8px" }}>
            {job.status === "approved"
              ? justApproved
                ? "It is on the page now."
                : `The film of ${pn.pos} life.`
              : justRemoved
                ? "It is off the page, and kept."
                : `The film of ${pn.pos} life is ready.`}
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: S.inkSoft, maxWidth: 620, marginTop: 0 }}>
            {job.status === "approved"
              ? isPlus
                ? `It lives on ${first}'s page now, on the tape shelf, for everyone who loves ${pn.obj}. You can weave it again, or take it off the page, any time.`
                : `It is kept with ${first}'s page. Films rest on free pages — when the full memorial opens, it will play there for everyone.`
              : justRemoved
                ? `The film rests here, safe. Nothing is ever deleted — place it back on the page whenever you wish.`
                : `Woven from ${first}'s photographs, ${pn.pos} chapters, and your own words. Watch it first. It appears on the page only when you say so.`}
          </p>

          <video
            controls
            preload="metadata"
            poster={job.poster_url || undefined}
            src={job.film_url}
            style={{
              width: "100%",
              borderRadius: 12,
              background: "#241711",
              border: `1px solid ${S.creamDeep}`,
              margin: "18px 0 8px",
            }}
          />
          {job.duration_seconds ? (
            <div style={{ fontFamily: "'Sometype Mono', monospace", fontSize: 12, color: S.inkSoft, marginBottom: 18 }}>
              {Math.floor(Number(job.duration_seconds) / 60)}:{String(Math.round(Number(job.duration_seconds) % 60)).padStart(2, "0")}
              {isTeaser ? " · a first glimpse" : ""}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10 }}>
            {job.status === "ready" && (
              <form method="post" action="/api/film/approve">
                <input type="hidden" name="job" value={job.id} />
                <input type="hidden" name="t" value={token} />
                <input type="hidden" name="slug" value={tribute.slug} />
                <button type="submit" style={button}>
                  {justRemoved ? "Place it back on the page" : "Let it appear on the page"}
                </button>
              </form>
            )}
            {job.status === "approved" && (
              <form method="post" action="/api/film/approve">
                <input type="hidden" name="job" value={job.id} />
                <input type="hidden" name="t" value={token} />
                <input type="hidden" name="slug" value={tribute.slug} />
                <input type="hidden" name="action" value="remove" />
                <button type="submit" style={quietButton}>Take it off the page</button>
              </form>
            )}
            <form method="post" action={`/api/tribute/${encodeURIComponent(tribute.slug)}/film`}>
              <input type="hidden" name="t" value={token} />
              {isPlus && isTeaser ? <input type="hidden" name="variant" value="full" /> : null}
              <button type="submit" style={quietButton}>
                {isPlus && isTeaser ? "Weave the whole film" : "Weave it again"}
              </button>
            </form>
            <a
              href={`/sites/${encodeURIComponent(tribute.slug)}`}
              style={{ ...quietButton, textDecoration: "none", display: "inline-block" }}
            >
              Visit {first}&rsquo;s page
            </a>
          </div>

          {!isPlus && isTeaser && job.status !== "approved" ? (
            <p style={{ fontSize: 15.5, lineHeight: 1.6, color: S.inkSoft, maxWidth: 560, marginTop: 26 }}>
              This is a first glimpse — the whole film of {pn.pos} life, with every chapter and
              {" "}{pn.pos} living pictures woven in, comes with the full memorial.{" "}
              <a href="/pricing" style={{ color: S.terra }}>When you are ready.</a>
            </p>
          ) : null}
        </>
      )}
    </Shell>
  );
}
