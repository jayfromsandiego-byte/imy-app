// LB-2 · a real phone video finally lands — Vercel Blob client uploads bypass
// the platform's own function body limit (the thing that actually kills a
// 60–400MB clip today, not our own size checks). This suite proves three
// things without the network: the shared MIME allow-list actually accepts
// the newly-folded-in kinds and actually rejects the dangerous ones (lib/uploadMedia.ts
// is plain TypeScript with no imports, so it runs for real here — no eval, no shim);
// pathname pinning actually rejects a crafted "../" or a foreign tribute's folder;
// and the token route (app/api/upload/client/route.ts) calls the right gate at the
// right seam for every caller kind, matching the house's read-the-real-file pattern
// used across the rest of this harness.
// Run via ops/qa/run.sh, or standalone: node ops/qa/lb2-blob-uploads.test.mjs
import { readFileSync } from "node:fs";

const ROOT = process.env.IMY_REPO_ROOT || process.cwd();
const read = (p) => readFileSync(`${ROOT}/${p}`, "utf8");

let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? pass++ : (fail++, console.log("  FAIL", name)); };

const media = await import(`${ROOT}/imy-app/lib/uploadMedia.ts`);
const { SAFE_MEDIA, kindOf, maxBytesFor, isPathnamePinnedToTribute, MAX_BYTES_BY_KIND } = media;

// ── the shared allow-list: the QoL broadening lands, the dangerous stuff doesn't ──
ok("3gpp video (older Android phones) is accepted", SAFE_MEDIA.test("video/3gpp"));
ok("amr audio (voicemail exports) is accepted", SAFE_MEDIA.test("audio/amr"));
ok("flac audio (lossless voice memos) is accepted", SAFE_MEDIA.test("audio/flac"));
ok("avif images (modern phone default) are accepted", SAFE_MEDIA.test("image/avif"));
ok("every pre-existing kind still holds (mp4 video)", SAFE_MEDIA.test("video/mp4"));
ok("every pre-existing kind still holds (heic image)", SAFE_MEDIA.test("image/heic"));
ok("an executable disguised as media is rejected", !SAFE_MEDIA.test("application/x-msdownload"));
ok("a scriptable svg is rejected — an SVG can carry a <script>", !SAFE_MEDIA.test("image/svg+xml"));
ok("plain html is rejected", !SAFE_MEDIA.test("text/html"));
ok("an empty content-type is rejected", !SAFE_MEDIA.test(""));

// ── kind detection feeds the right cap to the right file ────────────────────
ok("a video content-type is classified as video", kindOf("video/mp4") === "video");
ok("an audio content-type is classified as audio", kindOf("audio/flac") === "audio");
ok("an image content-type is classified as image", kindOf("image/avif") === "image");
ok("an unrecognized content-type has no kind", kindOf("application/x-msdownload") === null);
ok("video's cap is generous for a real phone clip (400MB)", maxBytesFor("video/mp4") === 400 * 1024 * 1024);
ok("audio's cap covers a long voicemail (60MB)", maxBytesFor("audio/mpeg") === 60 * 1024 * 1024);
ok("image's cap covers a 48MP HEIC (30MB)", maxBytesFor("image/heic") === 30 * 1024 * 1024);
ok("the three caps are still a wall, not unlimited", Object.values(MAX_BYTES_BY_KIND).every((n) => n > 0 && n < 5 * 1024 * 1024 * 1024));

// ── pathname pinning: a token must never write outside its own tribute's folder ──
ok("a well-formed tribute path is accepted", isPathnamePinnedToTribute("tributes/abc123/photo.jpg", "abc123"));
ok("a crafted ../ escape is rejected", !isPathnamePinnedToTribute("tributes/abc123/../../etc/passwd", "abc123"));
ok("a foreign tribute's folder is rejected", !isPathnamePinnedToTribute("tributes/someone-elses-id/video.mp4", "abc123"));
ok("an absolute path is rejected", !isPathnamePinnedToTribute("/etc/passwd", "abc123"));
ok("a bare prefix with nothing after it is rejected", !isPathnamePinnedToTribute("tributes/abc123/", "abc123"));
ok("a tribute id that isn't a clean token is rejected outright", !isPathnamePinnedToTribute("tributes/abc/x.jpg", "abc/../def"));
ok("a path outside the tributes/ prefix entirely is rejected", !isPathnamePinnedToTribute("onboarding/abc123/photo.jpg", "abc123"));

// ── the token route: real source, right gate at the right seam ──────────────
const route = read("imy-app/app/api/upload/client/route.ts");
ok("the route uses handleUpload from the Blob client package, not a hand-rolled protocol", route.includes('import { handleUpload') && route.includes('"@vercel/blob/client"'));
ok("family photo/voice tokens require the owner's own session", route.includes('payload.kind === "owner-photo" || payload.kind === "owner-voice"') && route.includes("await getUser()"));
ok("family video tokens require Plus — mirrors the tape shelf's own rule exactly", route.includes('payload.kind === "owner-video"') && route.includes("ownsPlusTribute(tributeId, user)"));
ok("a Free family's video request is denied before a token is ever minted", route.includes('throw new Error("plus_required")'));
ok("an owner token is pinned to that tribute's own folder before anything else runs", route.includes("isPathnamePinnedToTribute(pathname, tributeId)"));
ok("every owner branch resolves to the shared per-kind content-type list, not a wider one", route.includes("contentTypesFor(wantKind)"));
ok("the visitor and onboarding branches both call the shared rate limiter — same wall as every other public door", (route.match(/rateLimit\(`upload-client:/g) || []).length === 2);
ok("visitor and onboarding tokens are pinned to their own dedicated prefixes, never tributes/", route.includes('pathname.startsWith("visitor/")') && route.includes('pathname.startsWith("onboarding/")'));
ok("onUploadCompleted is deliberately not wired to a webhook — preview/localhost can't resolve one", !route.includes("onUploadCompleted:") && route.includes("onUploadCompleted"));
ok("failures map to real HTTP status codes, not a blanket 500", route.includes('"unauthorized" ? 401') && route.includes('"forbidden" || message === "plus_required" ? 403') && route.includes('"rate_limited" ? 429'));

// ── the client call sites actually switch to Blob above the small-file threshold ──
const mediaManager = read("imy-app/components/MediaManager.tsx");
const onboarding = read("imy-app/templates/onboarding.html");
const template = read("imy-app/templates/tribute-template.html");

ok("MediaManager imports the real upload() from @vercel/blob/client", mediaManager.includes('import { upload } from "@vercel/blob/client"'));
ok("MediaManager routes large photos to /api/upload/client, small ones stay on the proxy", mediaManager.includes("DIRECT_UPLOAD_THRESHOLD") && mediaManager.includes('handleUploadUrl: "/api/upload/client"') && mediaManager.includes('fetch("/api/upload"'));
ok("MediaManager's owner photo token carries its own tributeId and kind", mediaManager.includes('kind: "owner-photo", tributeId') || (mediaManager.includes('kind: "owner-photo"') && mediaManager.includes("tributeId }")));
ok("the honest 'coming with R2' line is gone — large media has an actual door now", !mediaManager.includes("coming with R2"));
ok("MediaManager's copy stays house voice — no exclamation points", !mediaManager.match(/[a-z][!]/i));

ok("onboarding's letter switches large files to a direct Blob upload", onboarding.includes("directUpload(f)") && onboarding.includes("DIRECT_UPLOAD_THRESHOLD"));
ok("onboarding's direct path is scoped to its own onboarding/ prefix (no tributeId exists yet)", onboarding.includes("'onboarding/'") && onboarding.includes("kind:'onboarding'"));

ok("the visitor memory form switches photo, voice, and video to direct upload above the threshold", template.includes("directUploadVisitor") && template.includes("DIRECT_UPLOAD_THRESHOLD"));
ok("the visitor direct path is scoped to its own visitor/ prefix, and carries the visitor kind", template.includes("directUploadVisitor(f,'visitor')") && template.includes("kind:'visitor'"));
ok("a visitor video no longer silently dies above the old 4.5MB/25MB wall — the cap is the real policy cap", template.includes("under 400MB"));
ok("a visitor voice memory's cap matches the shared 60MB audio policy", template.includes("under 60MB"));

// ── the two pre-existing routes still share one allow-list, not three drifting copies ──
const uploadRoute = read("imy-app/app/api/upload/route.ts");
const presignRoute = read("imy-app/app/api/upload/presign/route.ts");
ok("/api/upload imports the shared SAFE_MEDIA constant instead of a private copy", uploadRoute.includes('import { SAFE_MEDIA } from "@/lib/uploadMedia"'));
ok("/api/upload/presign imports the shared SAFE_MEDIA constant instead of a private copy", presignRoute.includes('import { SAFE_MEDIA } from "@/lib/uploadMedia"'));
ok("R2's presign door is left exactly as paused — still 501, not resumed", presignRoute.includes('{ ok: false, error: "not_configured" }, { status: 501 }'));

console.log(`\n${pass} passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
