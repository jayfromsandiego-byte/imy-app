// lib/email.ts — the app's quiet voice in the inbox, via Resend's REST API.
//
// Env-driven and silent by default, exactly like the tracking layer:
// without RESEND_API_KEY every send is a no-op that resolves false. No SDK,
// no new dependencies — one fetch to api.resend.com.
//
//   RESEND_API_KEY   re_...            (Vercel, Preview + Production)
//   EMAIL_FROM       I Miss You Memorial <hello@imissyoumemorial.com>
//
// Voice rules carried in code: short sentences, no exclamation points,
// no urgency. Every email a family receives should read like a kept promise.

const KEY = process.env.RESEND_API_KEY || "";
const FROM = process.env.EMAIL_FROM || "I Miss You Memorial <hello@imissyoumemorial.com>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://imissyoumemorial.com";

export const emailConfigured = Boolean(KEY);

const esc = (s = "") =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

/** The shared shell: cream paper, ink text, the wordmark, one quiet button. */
function shell(opts: { heading: string; bodyHtml: string; cta?: { label: string; url: string }; footnote?: string }) {
  const cta = opts.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px"><tr><td style="background:#A87C5F;border-radius:26px">
         <a href="${esc(opts.cta.url)}" style="display:inline-block;padding:13px 30px;color:#ffffff;text-decoration:none;font-weight:600;font-family:Georgia,'Times New Roman',serif;font-size:16px">${esc(opts.cta.label)}</a>
       </td></tr></table>`
    : "";
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#FAF5EC">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EC;padding:34px 0">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:92%">
        <tr><td style="font-family:Georgia,'Times New Roman',serif;color:#2C2520;font-size:19px;font-weight:bold;padding-bottom:26px">
          I <em style="color:#A87C5F">Miss</em> You Memorial
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid #e7dcc8;border-radius:14px;padding:36px 38px">
          <div style="font-family:Georgia,'Times New Roman',serif;color:#2C2520;font-size:24px;font-weight:bold;line-height:1.25;margin-bottom:14px">${opts.heading}</div>
          <div style="font-family:Georgia,'Times New Roman',serif;color:#3a332b;font-size:16px;line-height:1.65">${opts.bodyHtml}</div>
          ${cta}
        </td></tr>
        <tr><td style="font-family:'Courier New',monospace;color:#8a7f70;font-size:11.5px;letter-spacing:.06em;padding:22px 6px;line-height:1.7">
          ${esc(opts.footnote || "Every page stays online. We never charge a family to keep a memory alive.")}<br/>
          I Miss You Memorial · <a href="${SITE}" style="color:#A87C5F">imissyoumemorial.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

async function send(to: string, subject: string, html: string): Promise<boolean> {
  if (!KEY || !to || !/@/.test(to)) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
      cache: "no-store",
    });
    return r.ok;
  } catch {
    return false;
  }
}

const firstName = (full: string) => (full || "").trim().split(/\s+/)[0] || "them";

/** After the seal: their page is ready, and this email is the key back to it. */
export async function sendSealEmail(to: string, fullName: string, slug: string): Promise<boolean> {
  const first = firstName(fullName);
  const pageUrl = `${SITE}/sites/${encodeURIComponent(slug)}`;
  const html = shell({
    heading: `${esc(first)}'s page is ready.`,
    bodyHtml:
      `<p style="margin:0 0 12px">The letter is sealed. Everything you wrote now lives at</p>` +
      `<p style="margin:0 0 12px;font-family:'Courier New',monospace;font-size:14px"><a href="${esc(pageUrl)}" style="color:#A87C5F">${esc(slug)}.imissyoumemorial.com</a></p>` +
      `<p style="margin:0 0 12px">Share the address with anyone who loved ${esc(first)}. They can lay flowers, light candles, and leave memories — every memory waits for you before it appears.</p>` +
      `<p style="margin:0">This email address is your key. Sign in with it any time at <a href="${SITE}/signin" style="color:#A87C5F">imissyoumemorial.com/signin</a> to tend the page — approve memories, add photographs, change anything.</p>`,
    cta: { label: "Open their page", url: pageUrl },
  });
  return send(to, `${first}'s page is ready`, html);
}

/** The first memory is waiting — a gentle nudge to the caretaker's study. */
export async function sendMemoryWaitingEmail(to: string, fullName: string): Promise<boolean> {
  const first = firstName(fullName);
  const html = shell({
    heading: `Someone left a memory for ${esc(first)}.`,
    bodyHtml:
      `<p style="margin:0 0 12px">It is waiting quietly in your study. Nothing appears on ${esc(first)}'s page until you decide.</p>` +
      `<p style="margin:0">You can share it on the page, keep it just for the family, or sit with it a while.</p>`,
    cta: { label: "Read it in your study", url: `${SITE}/dashboard` },
  });
  return send(to, `A memory is waiting for ${first}`, html);
}

/** A day before the trial converts: honest notice, easy way out. */
export async function sendTrialReminderEmail(to: string, fullName: string, chargeDate: string): Promise<boolean> {
  const first = firstName(fullName);
  const html = shell({
    heading: "A quiet note about your trial.",
    bodyHtml:
      `<p style="margin:0 0 12px">Your three days with everything unlocked on ${esc(first)}'s page are almost done. On ${esc(chargeDate)}, your card will be charged $12 for the month.</p>` +
      `<p style="margin:0 0 12px">If Plus is helping, there is nothing to do.</p>` +
      `<p style="margin:0">If not, cancel from Billing before then and nothing is charged. ${esc(first)}'s page stays online either way — that is the promise.</p>`,
    cta: { label: "Manage billing", url: `${SITE}/dashboard/billing` },
    footnote: "You are receiving this because a trial of Plus is active on your page. Every page stays online, always.",
  });
  return send(to, "Your trial converts tomorrow", html);
}
