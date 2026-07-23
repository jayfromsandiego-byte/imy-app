// Contract checks for the paid purchase → full weave → placed film path.
import { readFileSync } from "node:fs";

const ROOT = process.env.IMY_REPO_ROOT || process.cwd();
const read = (p) => readFileSync(`${ROOT}/${p}`, "utf8");
const checkout = read("imy-app/app/api/stripe/checkout/route.ts");
const webhook = read("imy-app/app/api/stripe/webhook/route.ts");
const film = read("imy-app/lib/film.ts");
const migration = read("imy-app/supabase/migrations/0022_film_reliability.sql");
const refundMigration = read("imy-app/supabase/migrations/0023_refund_rest.sql");
const subscriptionMigration = read("imy-app/supabase/migrations/0024_subscription_rest.sql");
const worker = read("film-worker/worker.py");
const renderFilm = read("film-worker/render_film.py");
const storage = read("film-worker/storage.py");
const assetFetcher = read("film-worker/fetch_assets.sh");
const renderer = read("imy-app/lib/tributesData.ts");
const pageRenderer = read("imy-app/lib/renderTribute.ts");
const docker = read("film-worker/Dockerfile");
const railway = JSON.parse(read("film-worker/railway.json"));

let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? pass++ : (fail++, console.log("  FAIL", name)); };

ok("paid checkout requires a tribute identity", checkout.includes('includes(plan) && !tributeId && !slug'));
ok("webhook fails closed without its signing secret", webhook.includes('error: "webhook_secret_missing"') && webhook.includes("status: 503"));
ok("webhook fails closed without the database", webhook.includes('error: "database_not_configured"'));
ok("webhook returns 500 so Stripe retries fulfillment", webhook.includes('error: "fulfillment_failed"') && webhook.includes("status: 500"));
ok("paid film queueing is not swallowed", webhook.includes("await ensureFullFilmForPaid(tributeId)") && !webhook.includes("the keeper can ask for the weave"));
ok("app uses the atomic database promise", film.includes('db.rpc("ensure_full_film_for_paid"'));
ok("migration guards one active full weave", migration.includes("film_jobs_one_active_full_idx") && migration.includes("ensure_full_film_for_paid"));
ok("not-enough-photos has a truthful state", migration.includes("waiting_for_photos") && worker.includes('"status": "waiting_for_photos"'));
ok("adding the third photograph wakes a waiting paid film", migration.includes("wake_paid_film_after_photo") && migration.includes("tribute_photos_wake_paid_film"));
ok("database transaction records paid fulfillment ready", migration.includes("place_paid_film") && migration.includes("fulfillment_status = 'ready'"));
ok("paid full film auto-places without approval", worker.includes("def auto_place") && worker.includes('db.rpc("place_paid_film"'));
ok("one live public film is transactionally guarded", migration.includes("tribute_videos_one_live_film_idx") && migration.includes("set status = 'approved'"));
ok("public renderer reads the placed film from the shelf", renderer.includes('v.kind === "film"') && renderer.includes("filmVideo.url"));
ok("full refund rests Plus only when no paid entitlement remains", webhook.includes('db.rpc("rest_plus_after_full_refund"') && refundMigration.includes("status = 'refunded'") && refundMigration.includes("set tier = 'free'") && refundMigration.includes("status in ('trialing', 'active', 'past_due')"));
ok("canceled monthly trial rests Plus without deleting the memorial", webhook.includes('db.rpc("rest_plus_after_subscription_end"') && subscriptionMigration.includes("set status = 'canceled'") && subscriptionMigration.includes("set tier = 'free'") && subscriptionMigration.includes("stripe_subscription_id <> p_subscription_id"));
ok("refunded full film and sponsor plaque rest from the free public page", pageRenderer.includes('keptFilm.variant === "teaser"') && pageRenderer.includes('tier === "plus" && t.sponsor'));
ok("worker media fetches use a trusted-host allowlist and revalidate redirects", renderFilm.includes("TRUSTED_MEDIA_HOSTS") && renderFilm.includes("_NoRedirect") && renderFilm.includes("validate_media_url(final_url)"));
ok("Supabase film uploads carry both service-role headers", storage.includes('"apikey": SB_KEY') && storage.includes('"Authorization": f"Bearer {SB_KEY}"'));
ok("worker publishes a heartbeat", worker.includes('db.upsert("film_worker_heartbeats"'));
ok("container verifies every downloaded brand asset", docker.includes("fetch_assets.sh") && assetFetcher.includes("sha256sum -c -") && assetFetcher.includes("gymnopedie-1.flac"));
ok("container has a real health check", docker.includes("HEALTHCHECK") && docker.includes("/healthz"));
ok("Railway waits for health before activation", railway.deploy?.healthcheckPath === "/healthz" && railway.deploy?.restartPolicyType === "ALWAYS");

console.log(`\n${pass} passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
