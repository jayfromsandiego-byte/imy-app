// Contract checks for the paid purchase → full weave → placed film path.
import { readFileSync } from "node:fs";

const ROOT = process.env.IMY_REPO_ROOT || process.cwd();
const read = (p) => readFileSync(`${ROOT}/${p}`, "utf8");
const checkout = read("imy-app/app/api/stripe/checkout/route.ts");
const webhook = read("imy-app/app/api/stripe/webhook/route.ts");
const film = read("imy-app/lib/film.ts");
const migration = read("imy-app/supabase/migrations/0022_film_reliability.sql");
const worker = read("film-worker/worker.py");
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
ok("worker records paid fulfillment ready", worker.includes('"fulfillment_status": "ready"'));
ok("worker publishes a heartbeat", worker.includes('db.upsert("film_worker_heartbeats"'));
ok("container has a real health check", docker.includes("HEALTHCHECK") && docker.includes("/healthz"));
ok("Railway waits for health before activation", railway.deploy?.healthcheckPath === "/healthz" && railway.deploy?.restartPolicyType === "ALWAYS");

console.log(`\n${pass} passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
