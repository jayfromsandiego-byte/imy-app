// Contract checks for the July 23 mobile review decisions.
import { readFileSync } from "node:fs";

const ROOT = process.env.IMY_REPO_ROOT || process.cwd();
const read = (p) => readFileSync(`${ROOT}/${p}`, "utf8");
const landing = read("imy-app/templates/landing.html");
const onboarding = read("imy-app/templates/onboarding.html");
const renderer = read("imy-app/lib/renderTribute.ts");
const tributeData = read("imy-app/lib/tributesData.ts");
const memoryApi = read("imy-app/app/api/tribute/[slug]/memory/route.ts");
const upload = read("imy-app/app/api/upload/route.ts");
const migration = read("imy-app/supabase/migrations/0025_visitor_video_memories.sql");
const waiting = read("imy-app/app/dashboard/waiting/page.tsx");
const dashboard = read("imy-app/app/dashboard/page.tsx");
const editPage = read("imy-app/app/dashboard/tributes/[id]/page.tsx");
const actions = read("imy-app/app/dashboard/actions.ts");
const videos = read("imy-app/components/VideosManager.tsx");
const media = read("imy-app/components/MediaManager.tsx");
const template = read("imy-app/templates/tribute-template.html");
const archive = read("imy-app/app/api/tribute/[slug]/archive/route.ts");

let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? pass++ : (fail++, console.log("  FAIL", name)); };

ok("mobile wordmark keeps its full name", landing.includes("overflow:visible;text-overflow:clip;font-size:18px") && landing.includes("cta.cloneNode(true)"));
ok("story writing aligns with mobile rules", onboarding.includes("textarea{min-height:150px;line-height:28px") && onboarding.includes("transparent 27px"));
ok("draft recovery is visible and restartable", onboarding.includes('id="draftReturn"') && onboarding.includes("draftInfo") && onboarding.includes("startFresh"));
ok("onboarding speaks the twelve-photo rule", onboarding.includes("Photos and videos, so the page feels like them.") && onboarding.includes("12 photos are free") && !onboarding.includes("thirty photos are free"));
ok("renderer enforces twelve visible free photos", renderer.includes("const FREE_PHOTO_CAP = 12") && renderer.includes("allPhotos.slice(0, FREE_PHOTO_CAP)"));
ok("landing pricing promises twelve photos", landing.includes("Up to 12 photographs") && landing.includes("<span class=\"x\">up to 12</span>"));
ok("dashboard explains stored photos beyond twelve", media.includes("Free shows the first 12") && media.includes("safely for Plus"));
ok("family video upload is plus-gated in UI and server actions", videos.includes("Video upload is part of Plus") && actions.includes("ownsPlusTribute") && actions.includes('message: "Video upload is part of Plus."'));
ok("visitor video has additive storage", migration.includes("add column if not exists video_url") && migration.includes("'^https://'"));
ok("visitor video URL is host restricted", memoryApi.includes("keptVideoUrl") && memoryApi.includes(".hostname.toLowerCase()") && memoryApi.includes(".public.blob.vercel-storage.com") && memoryApi.includes("video_url: videoUrl"));
ok("visitor memories are always saved pending, served only when approved", memoryApi.includes('status: "pending"') && tributeData.includes('m.status === "approved"') && migration.includes("status = 'pending'"));
ok("visitor video upload is present and moderated", template.includes('id="videoAdd"') && template.includes("videoUrl:VIDEO.url||''") && waiting.includes("a video came with this memory"));
ok("free visitor video rests while plus may render", renderer.includes('vi: tier === "plus"') && tributeData.includes("video: m.video_url"));
ok("archive carries approved visitor video", archive.includes("video_url") && archive.includes("memories/videos"));
ok("dashboard makes every tribute editable and visitable", dashboard.includes("list.map((page: any)") && dashboard.includes("Visit page") && editPage.includes("Visit the live page"));
ok("free completion offers page and family study", onboarding.includes('id="finStudy"') && onboarding.includes("Open the family study"));
ok("long obituaries disclose the remainder", renderer.includes("Read the full obituary") && renderer.includes("sentences.slice(0, 3)"));
ok("onboarding photos default onto the board", renderer.includes("ownerBoardIds") && renderer.includes("Photograph ${i + 1}"));
ok("board guidance is specific", template.includes("Choose a board, then open a photograph, note, or video."));
ok("failed films lead to authenticated idempotent retry", renderer.includes("Open the family study") && actions.includes("retryPaidFilm") && actions.includes('db.rpc("ensure_full_film_for_paid"') && editPage.includes("Try the weave again"));
ok("uploads reject unsupported media", upload.includes("SAFE_MEDIA") && upload.includes("unsupported_type"));

console.log(`\n${pass} passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
