// The keepsakes catalog — single registry driving /tools, /templates, and /guides.
//
// House rules (SEO program, locked Aug 2026):
// - Only entries with status "live" render, join sitemaps, and get indexed.
//   "queued" entries 404. Shipping a page = flipping its status in this file
//   (plus its content module) on a preview branch, then merging.
// - User-generated outputs (a finished program, a drafted obituary) are NEVER
//   indexed — see lib/seo/meta.ts NOINDEX and keep outputs off these routes.
// - Every live page must carry an author, an artifact download, and a quiet
//   path to creating a memorial page. No exceptions.

export type SeoSection = "tools" | "templates" | "guides";
export type SeoStatus = "queued" | "live";

export interface SeoEntry {
  /** Path under the section root, no leading/trailing slashes. "" = section index. */
  slug: string;
  section: SeoSection;
  cluster:
    | "program"
    | "obituary"
    | "eulogy"
    | "cards"
    | "cost"
    | "admin"
    | "photo"
    | "poems"
    | "pet"
    | "pre-need";
  h1: string;
  description: string;
  status: SeoStatus;
}

export const seoCatalog: SeoEntry[] = [
  // ---- Funeral program (batch 1, Nos 1-15) ----
  { slug: "funeral-program", section: "templates", cluster: "program", h1: "Funeral Program Templates", description: "Free funeral program templates in every format — bifold, trifold, Word, and print-ready PDF — with room for their photo and story.", status: "live" },
  { slug: "funeral-program-maker", section: "tools", cluster: "program", h1: "Free Funeral Program Maker", description: "Make a funeral program in minutes. Fill in the service details once, see it laid out beautifully, and download it ready to print.", status: "live" },
  { slug: "funeral-program/word", section: "templates", cluster: "program", h1: "Funeral Program Template for Word", description: "An editable funeral program template for Microsoft Word, with fold guides that survive the download.", status: "live" },
  { slug: "funeral-program/pdf", section: "templates", cluster: "program", h1: "Free PDF Funeral Program Template", description: "A print-ready PDF funeral program template with bleed and fold marks, for home printers and print shops alike.", status: "live" },
  { slug: "funeral-program/bifold", section: "templates", cluster: "program", h1: "Bifold Funeral Program Template", description: "The classic single-fold program, panel by panel — what goes on the cover, inside, and back.", status: "live" },
  { slug: "funeral-program/trifold", section: "templates", cluster: "program", h1: "Trifold Funeral Program Template", description: "Six panels for a longer service — order of service, obituary, hymns, and thanks, each in its place.", status: "live" },
  { slug: "funeral-program/one-page", section: "templates", cluster: "program", h1: "One Page Funeral Program Template", description: "A simple single sheet for graveside and small services, with a large-print version included.", status: "live" },
  { slug: "funeral-program/order-of-service", section: "templates", cluster: "program", h1: "Order of Service Template", description: "The running order of a funeral or memorial service — readings, music, and words, in sequence.", status: "live" },
  { slug: "funeral-program/celebration-of-life", section: "templates", cluster: "program", h1: "Celebration of Life Program Template", description: "A brighter, story-first program for a celebration of life gathering.", status: "live" },
  { slug: "funeral-program/catholic", section: "templates", cluster: "program", h1: "Catholic Funeral Mass Program Template", description: "A funeral Mass program with the full liturgical order, from the Introductory Rites to the Final Commendation.", status: "live" },
  { slug: "funeral-program/baptist", section: "templates", cluster: "program", h1: "Baptist Funeral Program Template", description: "A homegoing service program with places for congregational songs, scripture, and the choir.", status: "live" },
  { slug: "funeral-program/methodist", section: "templates", cluster: "program", h1: "Methodist Funeral Program Template", description: "A Service of Death and Resurrection program following the United Methodist Book of Worship.", status: "live" },
  { slug: "funeral-program/lds", section: "templates", cluster: "program", h1: "LDS Funeral Program Template", description: "A ward chapel funeral program with the customary order of speakers and musical numbers.", status: "live" },
  { slug: "funeral-program/jewish", section: "templates", cluster: "program", h1: "Jewish Funeral Program Template", description: "A levaya program kept simple, as the tradition asks — El Malei Rachamim, Kaddish, and the walk to the grave.", status: "live" },
  { slug: "funeral-program/military", section: "templates", cluster: "program", h1: "Military Funeral Program Template", description: "A program that holds the honors — the flag, taps, and the words said when it is presented.", status: "live" },

  // ---- Obituary (Nos 16-26) ----
  { slug: "obituary", section: "templates", cluster: "obituary", h1: "Obituary Templates", description: "Fill-in obituary templates by length and tone, with real examples for every relationship.", status: "live" },
  { slug: "obituary-writer", section: "tools", cluster: "obituary", h1: "Free Obituary Writer", description: "Answer a few gentle questions and receive a complete obituary draft to review, line by line. Your words stay yours.", status: "live" },
  { slug: "obituary/mother", section: "templates", cluster: "obituary", h1: "Obituary Template for a Mother", description: "What children remember — with prompts and three full example obituaries for a mother.", status: "live" },
  { slug: "obituary/father", section: "templates", cluster: "obituary", h1: "Obituary Template for a Father", description: "Work, quiet acts of love, and what he taught — prompts and full examples for a father's obituary.", status: "live" },
  { slug: "obituary/husband", section: "templates", cluster: "obituary", h1: "Obituary Template for a Husband", description: "Written in the widow's voice, with the marriage as the spine of the story.", status: "live" },
  { slug: "obituary/wife", section: "templates", cluster: "obituary", h1: "Obituary Template for a Wife", description: "Written in the widower's voice, holding the daily life you built together.", status: "live" },
  { slug: "obituary/grandmother", section: "templates", cluster: "obituary", h1: "Obituary Template for a Grandmother", description: "Getting the generations right — survived-by formatting for a large, loving family.", status: "live" },
  { slug: "obituary/infant", section: "templates", cluster: "obituary", h1: "Obituary for an Infant", description: "The hardest page. Brief forms, gentle prompts, and support for parents writing what no parent should.", status: "live" },
  { slug: "obituary/friend", section: "templates", cluster: "obituary", h1: "Obituary for a Friend", description: "For the friend who is good with words, writing on the family's behalf — with a checklist for getting the facts right together.", status: "live" },
  { slug: "obituary/veteran", section: "templates", cluster: "obituary", h1: "Obituary Template for a Veteran", description: "Service details done properly — rank, branch, era, and honors, with a note on burial benefits.", status: "live" },
  { slug: "how-to-write-an-obituary", section: "guides", cluster: "obituary", h1: "How to Write an Obituary", description: "A calm, complete guide to writing an obituary — structure, what to include, and what may be left unsaid.", status: "queued" },

  // ---- Eulogy (Nos 27-31) ----
  { slug: "eulogy", section: "templates", cluster: "eulogy", h1: "Eulogy Template and Worksheet", description: "A worksheet that builds the eulogy from your memories — chronological, thematic, or written as a letter.", status: "queued" },
  { slug: "eulogy/mother", section: "templates", cluster: "eulogy", h1: "Eulogy for a Mother", description: "Memory prompts for a mother's eulogy, with two full annotated examples.", status: "queued" },
  { slug: "eulogy/father", section: "templates", cluster: "eulogy", h1: "Eulogy for a Father", description: "Saying what was never said aloud — prompts and annotated examples for a father's eulogy.", status: "queued" },
  { slug: "eulogy/friend", section: "templates", cluster: "eulogy", h1: "Eulogy for a Friend", description: "You knew them differently than family did. A worksheet for the friend asked to speak.", status: "queued" },
  { slug: "how-to-write-a-eulogy", section: "guides", cluster: "eulogy", h1: "How to Write a Eulogy", description: "Writing it is half. Delivering it is the other half — breath, breaking, and having a backup reader.", status: "queued" },

  // ---- Cards (Nos 32-38) ----
  { slug: "memorial-cards", section: "templates", cluster: "cards", h1: "Memorial Card Templates", description: "Memorial and prayer card templates by faith and style, with print specs for card stock.", status: "queued" },
  { slug: "memorial-card-maker", section: "tools", cluster: "cards", h1: "Free Memorial Card Maker", description: "A front-and-back memorial card with their photo, a verse or a poem, and the dates — ready to print.", status: "queued" },
  { slug: "memorial-cards/catholic-prayer-cards", section: "templates", cluster: "cards", h1: "Catholic Prayer Card Template", description: "The traditional holy card — Eternal Rest, Psalm 23, and the customs of saint imagery.", status: "queued" },
  { slug: "memorial-cards/christian", section: "templates", cluster: "cards", h1: "Christian Memorial Card Template", description: "Verses chosen by sentiment, with hymn lines and layouts for a Christian memorial card.", status: "queued" },
  { slug: "memorial-cards/jewish-yahrzeit", section: "templates", cluster: "cards", h1: "Yahrzeit Card Template", description: "A card that carries the Hebrew date — with the yahrzeit explained and calculated.", status: "queued" },
  { slug: "memorial-cards/secular", section: "templates", cluster: "cards", h1: "Secular Memorial Card Template", description: "Plain, honest words instead of scripture — poems and lines for a secular memorial card.", status: "queued" },
  { slug: "verses-for-memorial-cards", section: "guides", cluster: "cards", h1: "Verses for Memorial Cards", description: "Verses and lines for memorial cards, organized by faith and by feeling.", status: "queued" },

  // ---- Cost and planning (Nos 39-49) ----
  { slug: "funeral-cost-calculator", section: "tools", cluster: "cost", h1: "Funeral Cost Calculator", description: "An honest, itemized estimate of what a funeral costs, based on the choices you make. Printable, cited, no email required to see it.", status: "queued" },
  { slug: "cremation-cost-calculator", section: "tools", cluster: "cost", h1: "Cremation Cost Calculator", description: "Direct cremation or a service first — see what each path costs, itemized and cited.", status: "queued" },
  { slug: "average-funeral-cost", section: "guides", cluster: "cost", h1: "Average Funeral Cost", description: "What a funeral actually costs, from national median data, updated yearly and cited.", status: "queued" },
  { slug: "funeral-costs/california", section: "guides", cluster: "cost", h1: "Funeral Costs in California", description: "California funeral costs against the national median, with the state's own rules on embalming, home burial, and direct cremation.", status: "queued" },
  { slug: "funeral-costs/texas", section: "guides", cluster: "cost", h1: "Funeral Costs in Texas", description: "Texas funeral costs and rules — medians, direct cremation, and what the state requires.", status: "queued" },
  { slug: "funeral-costs/florida", section: "guides", cluster: "cost", h1: "Funeral Costs in Florida", description: "Florida funeral costs and rules, with the state's medians and legal notes.", status: "queued" },
  { slug: "funeral-costs/new-york", section: "guides", cluster: "cost", h1: "Funeral Costs in New York", description: "New York funeral costs and rules, with the state's medians and legal notes.", status: "queued" },
  { slug: "funeral-costs/pennsylvania", section: "guides", cluster: "cost", h1: "Funeral Costs in Pennsylvania", description: "Pennsylvania funeral costs and rules, with the state's medians and legal notes.", status: "queued" },
  { slug: "funeral-costs/illinois", section: "guides", cluster: "cost", h1: "Funeral Costs in Illinois", description: "Illinois funeral costs and rules, with the state's medians and legal notes.", status: "queued" },
  { slug: "funeral-costs/georgia", section: "guides", cluster: "cost", h1: "Funeral Costs in Georgia", description: "Georgia funeral costs and rules, with the state's medians and legal notes.", status: "queued" },
  { slug: "funeral-planning-checklist", section: "templates", cluster: "cost", h1: "Funeral Planning Checklist", description: "The first 72 hours, ordered by what cannot wait — printable, with the words for the hardest phone calls.", status: "queued" },

  // ---- Post-death admin (Nos 50-52) ----
  { slug: "when-someone-dies-checklist", section: "templates", cluster: "admin", h1: "What to Do When Someone Dies", description: "Hour by hour, then week by week — a printable map for the person holding everything together.", status: "queued" },
  { slug: "executor-checklist", section: "templates", cluster: "admin", h1: "Executor Checklist Template", description: "The executor's duties in order, with a document tracker. Plain language, no legal advice.", status: "queued" },
  { slug: "death-notification-letter", section: "templates", cluster: "admin", h1: "Death Notification Letter Template", description: "Gentle, ready letters for banks, utilities, and subscriptions — copy, personalize, send.", status: "queued" },

  // ---- Photo restoration (Nos 53-54) ----
  { slug: "photo-restoration", section: "tools", cluster: "photo", h1: "Free Photo Restoration", description: "Restore an old or damaged photograph in the browser — scratches mended, faces made clear again. Yours to keep.", status: "queued" },
  { slug: "restoring-old-family-photos", section: "guides", cluster: "photo", h1: "Restoring Old Family Photos", description: "What restoration can truly recover, what it cannot, and how to scan a printed photo well with just a phone.", status: "queued" },

  // ---- Poems and readings (Nos 55-57) ----
  { slug: "printable-memorial-poems", section: "templates", cluster: "poems", h1: "Printable Memorial Poems", description: "Memorial poems set beautifully for frames and programs, each verified public domain.", status: "queued" },
  { slug: "non-religious-funeral-readings", section: "guides", cluster: "poems", h1: "Non-Religious Funeral Readings", description: "Secular readings organized by feeling, with a printable pack for the service.", status: "queued" },
  { slug: "rainbow-bridge-poem", section: "templates", cluster: "poems", h1: "Rainbow Bridge Poem Printable", description: "The Rainbow Bridge poem, beautifully set and ready to print, with its history told honestly.", status: "queued" },

  // ---- Pet (No 58) — note: /pet-memorials/ lives outside the (seo) sections as a product page; tracked here for sitemap completeness when built.
  // ---- Pre-need (Nos 59-60) ----
  { slug: "funeral-wishes", section: "templates", cluster: "pre-need", h1: "Funeral Wishes Template", description: "Write it down while you can — a guided form for the service you would want, kept safe for the people who will need it.", status: "queued" },
  { slug: "end-of-life-checklist", section: "templates", cluster: "pre-need", h1: "End of Life Planning Checklist", description: "Documents, accounts, and wishes gathered into one binder your family can actually find.", status: "queued" },
];

export function liveEntries(section?: SeoSection): SeoEntry[] {
  return seoCatalog.filter((e) => e.status === "live" && (!section || e.section === section));
}

export function findEntry(section: SeoSection, slugParts: string[]): SeoEntry | undefined {
  const slug = slugParts.join("/");
  return seoCatalog.find((e) => e.section === section && e.slug === slug);
}

export function entryPath(e: SeoEntry): string {
  return `/${e.section}/${e.slug}/`;
}
