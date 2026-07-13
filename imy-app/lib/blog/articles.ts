// lib/blog/articles.ts — the article registry for "Notes on remembering".
//
// Articles are code: adding one is a deploy, which keeps publishing inside the
// branch → preview → main loop, type-checked, with no CMS to secure. Body HTML
// is limited to quiet elements (h2, p, a, ul/li, blockquote) styled by the
// blog shell. House voice throughout: no exclamation points, em dashes
// sparingly, honest and useful before anything else.

export type BlogArticle = {
  slug: string;
  /** SERP + page title, without the site suffix (the layout template adds it). */
  title: string;
  /** Meta description, ~150 characters, in the house voice. */
  description: string;
  datePublished: string; // ISO date
  dateModified?: string; // ISO date
  /** The opening line under the title — one italic breath before the piece. */
  lede: string;
  /** Article body: h2 / p / a / ul / li / blockquote only. */
  bodyHtml: string;
};

const whatToWrite: BlogArticle = {
  slug: "what-to-write-on-a-memorial-page",
  title: "What to write on a memorial page, when there are no words",
  description:
    "Gentle, honest phrases for a memorial page — for a mother, a father, a friend — and a quiet way to begin when every sentence feels too small.",
  datePublished: "2026-07-13",
  lede: "You do not need the perfect words. You need one true sentence, and the rest will follow it.",
  bodyHtml: `
<p>The blank field is the hardest part. People who spoke at the service without notes, people who write for a living, people who knew the person for sixty years — they all stall at the same white box, because it feels like the words are being asked to hold the whole person. They are not. A memorial page is not a eulogy and it is not a test. It is a table everyone brings one dish to.</p>
<p>Here is the secret nobody says out loud: on a memorial page, the plain words help the most. The sentence you almost delete for being too small is usually the one another mourner reads twice.</p>

<h2>Begin smaller than you think</h2>
<p>Do not try to summarize a life. Summaries belong to obituaries. Instead, write one specific, true thing that only someone who knew them would know.</p>
<blockquote>She kept every birthday card anyone ever gave her. Last week I found the one I made when I was six.</blockquote>
<p>That sentence does more than three paragraphs of adjectives. <em>Kind, generous, one of a kind</em> — those words are true of many people. The birthday cards were true of her.</p>

<h2>Phrases that open a memory</h2>
<p>If the first sentence will not come, borrow a beginning. Each of these unlocks a specific memory rather than a general feeling, which is why they work.</p>
<ul>
<li>I keep thinking about the way you…</li>
<li>No one else could…</li>
<li>You taught me…</li>
<li>I still have the…</li>
<li>Every time I hear…, you are there.</li>
<li>What I would give for one more…</li>
<li>You were the only person who…</li>
<li>I never told you this, but…</li>
</ul>
<p>Finish any one of them honestly and you have written something worth keeping.</p>

<h2>Words for a mother</h2>
<ul>
<li>You made every place feel like home. We are carrying that with us now.</li>
<li>Everything gentle in me started with you.</li>
<li>The kitchen still smells like Sunday. I miss you, Mom.</li>
<li>You loved us before we were easy to love, and after.</li>
</ul>

<h2>Words for a father</h2>
<ul>
<li>You never said much. You never had to.</li>
<li>Every steady thing I know, I learned watching you.</li>
<li>I hear your advice in my own voice now. I hope I say it half as well.</li>
<li>Thank you for every quiet drive, every fixed thing, every time you showed up.</li>
</ul>

<h2>Words for a husband, a wife, a partner</h2>
<ul>
<li>Fifty-two years, and it still was not enough.</li>
<li>You were the first person I told everything. I keep turning to tell you this.</li>
<li>Half of every story I own is yours.</li>
<li>Save me a seat.</li>
</ul>

<h2>Words for a friend</h2>
<ul>
<li>You knew every chapter of me and stayed for all of them.</li>
<li>Nobody will laugh at that with me now. I will laugh anyway, for both of us.</li>
<li>Thank you for choosing me, over and over, all those years.</li>
</ul>

<h2>For someone who left too soon</h2>
<p>When the loss is out of order, fewer words are better. Do not explain. Do not reach for meaning yet.</p>
<ul>
<li>We will say your name at every table.</li>
<li>You should be here. You will always be here.</li>
<li>The world got quieter, and we are not pretending it didn't.</li>
</ul>

<h2>What to leave out</h2>
<p>A few things do not belong on a memorial page, however kindly they are meant.</p>
<ul>
<li><strong>The cause of death,</strong> unless the family has spoken of it first. Their page, their telling.</li>
<li><strong>"At least" sentences.</strong> <em>At least she is not suffering. At least you had him so long.</em> Comfort math never comforts.</li>
<li><strong>Old grievances and settlings of account.</strong> Carry those elsewhere.</li>
<li><strong>Apologies for your words being too short or too plain.</strong> They are not.</li>
</ul>

<h2>If you are writing the main story, not a short memory</h2>
<p>The person keeping the page carries a different weight: the life story itself. Two things make it lighter. First, you do not have to write an obituary — the newspaper version can stay formal; the page does not have to. Write the way you would tell a new friend about them at a kitchen table. Second, write in chapters, not in one sitting. The garden years. The shop. The grandchildren. Chapters forgive gaps; a single narrative demands completeness you should not ask of yourself this month.</p>

<h2>Where the words should live</h2>
<p>One more thing, practical and easily missed. Words left on social feeds sink within a week, and comments under a post are the first thing lost when an account is <a href="/blog/facebook-memorialized-account-what-happens">memorialized or deleted</a>. Words scattered across group chats never gather. If people are going to write — and they will, if you give them somewhere to stand — let it be a place that keeps them: <a href="/">a memorial page of their own</a>, where every sentence waits for the family and stays.</p>
<p>The words are allowed to be small. Missing someone is made of small things: the cards, the Sunday kitchen, the seat you still leave open. Write one of them down. That is how a page — and a person — is remembered.</p>
`,
};

const facebookMemorialized: BlogArticle = {
  slug: "facebook-memorialized-account-what-happens",
  title: "When Facebook memorializes an account: what happens next",
  description:
    "What a memorialized Facebook profile can and cannot do, how legacy contacts work, and how families keep the photos and words that matter.",
  datePublished: "2026-07-13",
  lede: "The word Remembering appears above their name, and the account you knew becomes something else — held, but not quite yours.",
  bodyHtml: `
<p>Sooner or later, most families meet this word: <em>memorialized.</em> It is what Facebook calls an account after the company learns its owner has died. The profile stays, the photos stay, but the rules around them change in ways that surprise almost everyone — usually at the worst possible time to be surprised.</p>
<p>Here is what actually happens, plainly, and what is worth doing before anything changes.</p>

<h2>What memorialization actually does</h2>
<ul>
<li>The word <strong>Remembering</strong> appears above the person's name on their profile.</li>
<li><strong>No one can log in to the account again.</strong> Not family, not with the password, not with a death certificate.</li>
<li>The profile stops appearing in birthday reminders, friend suggestions, and ads — the small ambushes that make un-memorialized accounts so painful.</li>
<li>Everything the person shared stays visible <strong>to the audience it was originally shared with.</strong> A photo that was friends-only stays friends-only, forever.</li>
</ul>

<h2>Who can ask for it</h2>
<p>Anyone can request memorialization — a friend, a cousin, a colleague — by sending Facebook proof that the person has died, usually an obituary or a news link. Facebook does not hand over the account to whoever asks; it simply seals it. The request forms live in <a href="https://www.facebook.com/help/103897939701143" target="_blank" rel="noopener noreferrer">Facebook's Help Center</a>.</p>
<p>It is worth doing sooner rather than later. An un-memorialized account can be hacked, spammed, or flagged — and a sealed account is protected from all three.</p>

<h2>What a legacy contact can do, and cannot</h2>
<p>If — and only if — the person chose a legacy contact while they were alive, that one person gets a narrow set of keys. As Facebook describes it today, a legacy contact can:</p>
<ul>
<li>Write one pinned tribute post at the top of the profile.</li>
<li>Decide who may post tributes, and manage those posts.</li>
<li>Update the profile picture and cover photo.</li>
<li>Respond to new friend requests.</li>
<li>Request the account's deletion.</li>
<li>Download a copy of what was shared — but only if the person granted that permission in advance.</li>
</ul>
<p>A legacy contact cannot log in, cannot read private messages, cannot remove old posts or photos, and cannot change who sees what. And if no legacy contact was ever named, none of the above is possible for anyone. The account is sealed exactly as it stood.</p>

<h2>The parts families find hard</h2>
<ul>
<li><strong>The voice notes and messages are unreachable.</strong> Messenger threads — including audio messages, often the only recordings of a voice — are private and stay that way.</li>
<li><strong>The photos are locked at their old privacy settings.</strong> A lifetime of pictures may be visible only to a friends list no one can edit again.</li>
<li><strong>Tributes sink.</strong> The words people leave scroll away like everything else in a feed.</li>
<li><strong>The rules are not yours.</strong> A platform can change its policies, its features, or its mind. Families live with whatever it decides.</li>
<li><strong>Deletion is total.</strong> An immediate family member can ask for the account to be removed — and everything on it, including every comment and memory others left, goes with it.</li>
</ul>

<h2>Keeping what matters, before anything changes</h2>
<ul>
<li>If the family still has access on a trusted device, use <strong>Download Your Information</strong> first — photos, posts, and videos, in one archive.</li>
<li>Save voice notes and videos out of Messenger separately, one by one if needed. They are the most irreplaceable thing on the account.</li>
<li>Screenshot the comments under the big posts. The words people left are the first thing lost and the thing families miss most.</li>
<li>Agree as a family on who requests what. Memorialization is reversible in spirit — deletion is not.</li>
</ul>

<h2>A place that is yours</h2>
<p>A memorialized profile is a locked room: precious, but no one can add to it, arrange it, or promise it will be there in twenty years. That is the quiet argument for giving a person <a href="/">a memorial page of their own</a> — a place where the photos can be gathered from everywhere, where a voice can be kept on purpose, where the words people write <a href="/blog/what-to-write-on-a-memorial-page">wait for the family</a> instead of scrolling away, and where the rules never change under you. Every tribute stays online; no family is ever charged to keep a memory alive. That is a promise a feed was never built to make.</p>
`,
};

const qrGuide: BlogArticle = {
  slug: "qr-code-memorial-guide",
  title: "A guide to QR code memorials: plaques, benches, and headstones",
  description:
    "How QR code memorials work, what the code should open, and how to choose a plaque that lasts as long as the memory it carries.",
  datePublished: "2026-07-13",
  lede: "A small square of code on a plaque, and suddenly a headstone can hold more than a name and two dates.",
  bodyHtml: `
<p>A headstone holds a name, two dates, and perhaps a line of scripture. It has always been this way, because granite charges by the letter and grief pays the bill. A QR code memorial is a quiet workaround: a small engraved code on the stone, a bench, or a garden plaque, and anyone who pauses there can hold up a phone and step into the whole life — the photos, the story, the voices of the people who loved them.</p>

<h2>What a QR code memorial is</h2>
<p>It is two things joined together. The first is physical: a weatherproof plaque, usually two or three inches across, engraved with a QR code and mounted on a marker, a bench, an urn, or a frame. The second is digital: the memorial page the code opens. The stone holds the name; the page holds the life.</p>

<h2>How it works, in one minute</h2>
<p>A QR code is simply a web address, printed as a pattern. Every modern phone reads one through its camera — no app, no typing. Someone visiting the grave points their camera at the plaque, a link appears, and the memorial page opens. A great-niece who never met them, a stranger walking the cemetery rows, a grandchild in thirty years: the same small square works for each of them.</p>

<h2>The question that matters more than the plaque</h2>
<p>Most guides begin with the plaque. That is backwards. <strong>A QR code is only as permanent as the page it opens.</strong> The code itself cannot expire — it is ink and metal — but the link inside it can die in all the usual ways: a memorial service that shuts down, a subscription that lapses, a social profile that gets <a href="/blog/facebook-memorialized-account-what-happens">memorialized or deleted</a>. When that happens, the plaque on the stone opens an error page. Forever.</p>
<p>So before choosing metal finishes, ask one question of whatever service will host the page: <em>what happens to the page if I stop paying?</em> If the honest answer is that the page rests but stays online, you can mount the code with a clear conscience. That is the standard we hold ourselves to — every tribute stays online, and no family is ever charged to keep a memory alive.</p>

<h2>Choosing the physical plaque</h2>
<ul>
<li><strong>Engraved metal outlasts everything else.</strong> Laser-engraved anodized aluminum or stainless steel holds its contrast for decades. Printed stickers and resin domes fade in a few summers of sun.</li>
<li><strong>Matte finishes scan better.</strong> Polished metal throws glare at exactly the angle a phone needs.</li>
<li><strong>Two to three inches is right</strong> for a scan from arm's length. Smaller works on an urn or a frame indoors.</li>
<li><strong>Ask the cemetery first.</strong> Many have rules about attachments to markers — some allow adhesive plaques, some require a separate stake or stone, a few decline them entirely. A garden bench, a memorial tree, or a framed plaque at home are gracious alternatives.</li>
</ul>

<h2>Setting one up in an afternoon</h2>
<ul>
<li><strong>Create the page first.</strong> A <a href="/">memorial page</a> with their photos, their story, and room for others to add memories. Begin with what you have; pages can grow for years after the plaque is mounted.</li>
<li><strong>Use the page's own address — never a link shortener.</strong> A shortened link adds a middleman that can vanish and take the code with it. The same is true of "dynamic QR" subscriptions that charge yearly to keep a redirect alive. A static code pointing at a stable address needs no one's permission to keep working.</li>
<li><strong>Generate the code</strong> with any reputable free generator, saved as a high-resolution file. Choose the highest error-correction level offered — it lets a scratched or weathered code keep scanning.</li>
<li><strong>Test before you mount.</strong> Several phones, bright sun, deep shade, dusk. Thirty seconds of testing spares years of quiet failure.</li>
<li><strong>Photograph the installed plaque</strong> and share the picture with the family, so everyone knows the code exists and what it opens.</li>
</ul>

<h2>What it costs</h2>
<p>Less than people expect. The memorial page itself can be free — ours is, forever. An engraved aluminum or stainless plaque typically runs between fifteen and sixty dollars from an engraving shop or online; cast bronze costs more and is worth it on a prominent marker. There is no reason to accept a recurring fee for the code itself.</p>

<h2>Questions people ask</h2>
<ul>
<li><strong>Do QR codes expire?</strong> No. The printed code works as long as it is legible. Only the destination can die — which is why the page behind it matters more than the plaque.</li>
<li><strong>Can we change the page after the plaque is mounted?</strong> Yes, endlessly. That is the quiet beauty of it: the stone is fixed, but the page can gather <a href="/blog/what-to-write-on-a-memorial-page">new words</a>, new photos, and new voices for decades. The code never needs to change.</li>
<li><strong>What if someone scans it in forty years?</strong> That is the hope, and the real design question. Choose a keeper whose promise is measured in generations, not billing cycles.</li>
<li><strong>Rain, frost, scratches?</strong> Engraved metal with high error correction shrugs off weather. Glance at it once a year and wipe it clean; that is all the maintenance there is.</li>
</ul>
<p>A visitor stands at the stone, lifts a phone, and hears a laugh they had almost forgotten. That is what all the aluminum and error correction is for.</p>
`,
};

export const articles: BlogArticle[] = [whatToWrite, facebookMemorialized, qrGuide];

export function getArticle(slug: string): BlogArticle | undefined {
  return articles.find((a) => a.slug === slug);
}

export function readingMinutes(a: BlogArticle): number {
  const words = a.bodyHtml.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 220));
}
