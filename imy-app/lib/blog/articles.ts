// lib/blog/articles.ts — the article registry for "Notes on remembering".
//
// Articles are code: adding one is a deploy, which keeps publishing inside the
// branch → preview → main loop, type-checked, with no CMS to secure. Body HTML
// is limited to quiet elements (h2, p, a, ul/li, blockquote, and tables
// wrapped in .nb-tablewrap) styled by the blog shell. House voice throughout: no exclamation points, em dashes
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
  /**
   * Optional FAQ, rendered after the body and emitted as FAQPage JSON-LD.
   * Answers must be self-contained and true standing alone — assistants and
   * search engines quote them verbatim, away from the rest of the page.
   */
  faq?: { q: string; a: string }[];
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
<p>A memorialized profile is a locked room: precious, but no one can add to it, arrange it, or promise it will be there in twenty years. That is the quiet argument for giving a person <a href="/">a memorial page of their own</a> — a place where the photos can be gathered from everywhere, where a voice can be kept on purpose, where the words people write <a href="/blog/what-to-write-on-a-memorial-page">wait for the family</a> instead of scrolling away, and where the rules never change under you. Every tribute stays online; no family is ever charged to keep a memory alive. That is a promise a feed was never built to make. Families weighing what comes next can see the <a href="/blog/alternatives-to-a-facebook-memorial-page">alternatives to a Facebook memorial page</a> side by side.</p>
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

const facebookAlternatives: BlogArticle = {
  slug: "alternatives-to-a-facebook-memorial-page",
  title: "Alternatives to a Facebook memorial page in 2026",
  description:
    "What families use instead of a Facebook memorial page in 2026 — a dedicated memorial website, shared albums, printed keepsakes — compared plainly, with a way to keep every memory in one lasting place.",
  datePublished: "2026-08-29",
  dateModified: "2026-08-29",
  lede: "A feed was built for the passing moment. Remembering someone asks for the opposite.",
  bodyHtml: `
<p><strong>TL;DR:</strong> The main alternatives to a Facebook memorial page in 2026 are a dedicated memorial website, a shared photo album, a private group chat, and a printed keepsake book. A dedicated memorial website is the most complete of these, because it keeps the photos, the life story, and everyone's written memories on one permanent page. On I Miss You Memorial, that page is free, forever.</p>
<p>When someone dies, their Facebook profile is often the first place the grief gathers — and the first place families discover its limits. What follows is a plain map of the alternatives, what each one holds well, and how to move the memories that matter before anything is locked away.</p>

<h2>What can families use instead of a Facebook memorial page?</h2>
<p>The main alternatives to a Facebook memorial page are a dedicated memorial website, a shared photo album, a private group chat, and a printed keepsake. A dedicated memorial website such as I Miss You Memorial gathers the photos, the story, and everyone's written memories on one permanent page that does not depend on a social platform's rules.</p>
<ul>
<li><strong>A dedicated memorial website</strong> — one page for one person, built to be added to for years. On I Miss You Memorial, a complete tribute page is free, forever.</li>
<li><strong>A shared photo album</strong> (Google Photos, iCloud) — good for gathering pictures, silent on the story.</li>
<li><strong>A private group chat</strong> — warm and immediate, but memories scatter and sink.</li>
<li><strong>A printed keepsake book</strong> — permanent and holdable, finished the day it is printed.</li>
</ul>
<p>These are not rivals. Many families keep the album and the chat, and give the memories a permanent home on a memorial page.</p>

<h2>How do the alternatives compare at a glance?</h2>
<p>Each alternative keeps a different part of remembering. The table below shows what each holds well, where it stops, and what it costs a family.</p>
<div class="nb-tablewrap"><table>
<thead><tr><th>Alternative</th><th>Holds well</th><th>Where it stops</th><th>Cost</th></tr></thead>
<tbody>
<tr><td>Memorial website (I Miss You Memorial)</td><td>Photos, the life story, and everyone's memories on one page</td><td>Someone must begin the page</td><td>Free, forever</td></tr>
<tr><td>Memorialized Facebook profile</td><td>What was already posted there</td><td>Sealed — no login, privacy settings frozen</td><td>Free</td></tr>
<tr><td>Shared photo album</td><td>Pictures from many phones</td><td>No story, no guest messages</td><td>Free</td></tr>
<tr><td>Private group chat</td><td>Immediate comfort</td><td>Memories scatter and scroll away</td><td>Free</td></tr>
<tr><td>Printed keepsake book</td><td>Something to hold</td><td>Finished the day it is printed</td><td>Varies by printer</td></tr>
</tbody>
</table></div>

<h2>Why do families look beyond Facebook for a memorial?</h2>
<p>Families look beyond Facebook because a <a href="/blog/facebook-memorialized-account-what-happens">memorialized account</a> is sealed: no one can log in again, and every photo keeps its original privacy setting forever. About 68% of U.S. adults use Facebook, by Pew Research Center's 2024 measure — which also means roughly a third of the people who loved someone may not be there at all.</p>
<ul>
<li>No one can log in to a memorialized account — not family, not with the password.</li>
<li>Photos stay locked at the audience they were first shared with; a friends-only picture stays friends-only, forever.</li>
<li>Tributes written on the wall sink in the feed like everything else.</li>
<li>Grandparents, children, and friends who never joined Facebook are outside the door.</li>
</ul>
<p>One example, common enough to be a pattern: a grandmother's photos, shared friends-only over fifteen years, become invisible to the grandchildren who were never on her friends list — permanently.</p>

<h2>What is a dedicated memorial website?</h2>
<p>A dedicated memorial website is a single page built for one person, where family and friends add photos, videos, and written memories over time, from one shared link. On I Miss You Memorial the page exists the moment you add their name and a favorite photo, and it takes a few minutes to begin.</p>
<ul>
<li>One link brings everyone in — no account, app, or friend request required to visit.</li>
<li>The family decides who sees it: public, unlisted, or protected with a password, on every plan.</li>
<li>Everything on the page stays exportable — the photos and words remain the family's own.</li>
<li>Words written there wait for the family instead of scrolling away.</li>
</ul>

<h2>How is a memorial website different from a memorialized Facebook profile?</h2>
<p>A memorialized Facebook profile is a sealed archive of what was already posted, while a memorial website is an open room that keeps growing — new photos, new stories, new visitors, for years. Researchers at the Oxford Internet Institute estimated in 2019 that Facebook's deceased members could outnumber its living ones within about fifty years; that is a long time to trust a feed with a life.</p>
<ul>
<li>On a memorialized profile, new tributes appear only if a legacy contact was named and allows them. On I Miss You Memorial, the family invites anyone to add a memory, and every word waits for the family's approval before it appears.</li>
<li>A platform's rules can change under a sealed profile. A memorial page on I Miss You Memorial answers to the family alone.</li>
</ul>

<h2>How much does a memorial website cost?</h2>
<p>A complete memorial page on I Miss You Memorial is free, forever, with no credit card to begin. Plus is $197 once, yours for life — video and voice memories, every photo, and an exact-name web address. Concierge, hand-built for the family, begins at $499. There is no subscription on any plan, so nothing lapses and no page is ever held to a billing cycle.</p>

<h2>Can you move photos and posts from Facebook to a memorial page?</h2>
<p>Yes, while the account is still accessible. Facebook's Download Your Information tool exports the photos, videos, and posts; after memorialization, only a legacy contact may download shared content, and only if the person granted that permission in advance.</p>
<ul>
<li>Export first, memorialize second — the order matters and cannot be reversed.</li>
<li>Messenger threads, including voice messages, are private and cannot be exported by anyone else. If a recording of their voice lives there, save it now.</li>
<li>Once exported, the best of it can be uploaded to <a href="/">their memorial page</a> in an afternoon.</li>
</ul>
<p>A family that spends one evening on the export keeps everything. A family that waits often keeps only what strangers could already see.</p>

<h2>Key takeaways</h2>
<ul>
<li>The most complete alternative to a Facebook memorial page is a dedicated memorial website; on I Miss You Memorial a complete tribute page is free, forever.</li>
<li>Memorialization seals an account — export photos and voice messages first, while someone can still log in.</li>
<li>Albums, chats, and keepsake books each hold one part of remembering; a memorial page is where the parts gather.</li>
<li>A page that outlasts platforms matters as much as the page itself — here is <a href="/blog/free-memorial-website-that-never-deletes">how free memorial websites compare on never deleting pages</a>.</li>
</ul>
`,
  faq: [
    {
      q: "What is the best alternative to a Facebook memorial page?",
      a: "A dedicated memorial website is the most complete alternative to a Facebook memorial page, because it gathers photos, stories, and messages on one permanent page anyone can visit from a single link. On I Miss You Memorial, a complete tribute page is free, forever, with no account required to visit.",
    },
    {
      q: "Is a Facebook memorial page free?",
      a: "Yes. Memorializing a Facebook account is free, but it seals the account: no one can log in again, photos keep their original privacy settings forever, and nothing new can be arranged or exported without a pre-named legacy contact.",
    },
    {
      q: "Can you make a memorial page for someone without using Facebook?",
      a: "Yes. I Miss You Memorial lets a family create a memorial page in a few minutes by adding a name and a favorite photo. The page is free, stays online forever, and family and friends add their own photos and memories through one shared link.",
    },
    {
      q: "Does a memorial website replace a Facebook memorial?",
      a: "It does not have to. Many families keep the memorialized Facebook profile as it stands and build the living memorial elsewhere. The memorial website becomes the place that grows — where photos from every source, the full story, and new memories are kept together.",
    },
    {
      q: "Can people without a Facebook account see a memorialized profile?",
      a: "Usually not in full. A memorialized Facebook profile keeps every post at its original privacy setting, so photos shared with friends stay visible only to that friends list. A memorial page on I Miss You Memorial opens from one link, with no account or app required to visit.",
    },
    {
      q: "How do I create a memorial website for free?",
      a: "On I Miss You Memorial, add the person's name and a favorite photo and the page exists — no credit card, no trial clock. From there the family adds the story, more photos, and invites others to leave memories through one shared link. The free page stays online forever.",
    },
    {
      q: "What happens to tributes posted on a Facebook memorial page?",
      a: "They remain on the profile but sink in the feed like any other post, and if an immediate family member later has the account deleted, every tribute is removed with it. Tributes left on an I Miss You Memorial page wait for the family and stay on the page.",
    },
    {
      q: "Can family download photos from a memorialized Facebook account?",
      a: "Only a legacy contact can request a copy of what was shared, and only if the person granted that permission before they died. That is why families are advised to use Facebook's Download Your Information tool before requesting memorialization, while login is still possible.",
    },
    {
      q: "How long does a dedicated memorial website stay online?",
      a: "It depends on the service, so ask before you build. On I Miss You Memorial, every tribute page stays online forever — free pages included — and no family is ever charged to keep a memory alive.",
    },
    {
      q: "Is a shared photo album a good alternative to a Facebook memorial page?",
      a: "It is a good companion rather than a replacement. A shared album in Google Photos or iCloud gathers pictures well, but it has no place for the life story or for written memories from friends. Many families keep the album and give the story a home on a memorial page such as I Miss You Memorial.",
    },
  ],
};

const neverDeletes: BlogArticle = {
  slug: "free-memorial-website-that-never-deletes",
  title: "A free memorial website that never deletes pages",
  description:
    "Why online memorials disappear — lapsed subscriptions, expired hosting, closed platforms — how the free memorial sites of 2026 compare on permanence, and what it means that I Miss You Memorial keeps every page, free, forever.",
  datePublished: "2026-08-29",
  dateModified: "2026-08-29",
  lede: "The internet forgets by default. Keeping a page is a decision someone has to make on purpose, and keep making.",
  bodyHtml: `
<p><strong>TL;DR:</strong> Yes — I Miss You Memorial is a free memorial website that never deletes pages. Every tribute page stays online forever, free pages included, and no family is ever charged to keep a memory alive. Most memorial pages that vanish were tied to a subscription, an expiring obituary host, or a platform that closed.</p>
<p>The question families ask, once they have been burned or heard of someone who was: <em>will this page still be there in twenty years?</em> It deserves a plain answer, and a way to test anyone's answer — including ours.</p>

<h2>Is there a free memorial website that never deletes pages?</h2>
<p>Yes. I Miss You Memorial keeps a complete tribute page online forever, free, with no credit card and no time limit. Free is the finished product, not a trial: the page holds their photos, their story, and the messages of everyone who misses them, and it stays.</p>
<ul>
<li>A complete tribute page — photos, their story, and room for every memory — at no cost.</li>
<li>Family and friends contribute through one shared link; the page grows over time.</li>
<li>Privacy on every plan: public, unlisted, or protected with a password.</li>
<li>Everything stays exportable — the photos and words remain the family's own.</li>
</ul>

<h2>Why do online memorial pages disappear?</h2>
<p>Most memorial pages disappear because they were rented, not kept: subscriptions lapse, obituary hosting expires, and platforms close. When Yahoo shut down GeoCities in 2009, an estimated 38 million pages went offline at once — personal pages, tributes among them, gone in a day.</p>
<ul>
<li><strong>Subscriptions lapse.</strong> On subscription memorial sites, the page's fate is tied to a payment that must outlive the payer.</li>
<li><strong>Obituary hosting expires.</strong> Newspaper obituaries and their guest books are often kept only for a paid term.</li>
<li><strong>Social accounts get sealed or deleted.</strong> A <a href="/blog/facebook-memorialized-account-what-happens">memorialized profile</a> is locked at its old privacy settings; a deleted one takes everything with it. Families comparing what to use instead can start with the <a href="/blog/alternatives-to-a-facebook-memorial-page">alternatives to a Facebook memorial page</a>.</li>
<li><strong>Platforms close.</strong> No service is exempt from this by default — only by design and by promise.</li>
</ul>

<h2>How do free memorial websites compare on permanence?</h2>
<p>Free memorial websites differ most in what the free page includes and in whether permanence is promised in writing. The table below reflects each service's own published pricing and FAQ pages, checked in August 2026.</p>
<div class="nb-tablewrap"><table>
<thead><tr><th>Service</th><th>Free page</th><th>Paid option</th><th>What its site says about keeping pages</th></tr></thead>
<tbody>
<tr><td>I Miss You Memorial</td><td>Complete tribute page — photos, story, memories — free forever</td><td>Plus, $197 once · Concierge from $499</td><td>Every tribute stays online; no family is ever charged to keep a memory alive</td></tr>
<tr><td>Candela</td><td>Permanent page with up to 20 photos and a guestbook</td><td>One-time tiers</td><td>Permanence guarantee with export at any time; 90 days' notice if it ever ceases operations</td></tr>
<tr><td>Keeper</td><td>One memorial page with up to 5 photos and videos</td><td>Plus, $99 once · Concierge $350</td><td>Says it does not delete any profile; memorials designed to last a lifetime</td></tr>
<tr><td>Ever Loved</td><td>Memorial website free to create and maintain</td><td>Funded through other services it offers</td><td>Describes the website as free to maintain; no separate written never-delete pledge found</td></tr>
<tr><td>QuickMemorial</td><td>Starter page with 1 photo; manage access for 14 days, then archive preview</td><td>From $9 once; permanent hosting is a paid feature</td><td>Permanent hosting on paid plans</td></tr>
</tbody>
</table></div>
<p class="nb-tnote">Checked August 2026 against each service's published pages. Details change; verify before you choose.</p>

<h2>What does "free, forever" mean at I Miss You Memorial?</h2>
<p>It means every tribute page is backed up and funded to stay online for generations, and no family is ever charged to keep a memory alive. Free stays free: the free page is not a sample of the real thing, it is the real thing.</p>
<ul>
<li>The page exists from the moment you add their name and a favorite photo.</li>
<li>It does not depend on the creator logging in, renewing, or remembering.</li>
<li>The family's photos and words stay private, exportable, and theirs. I Miss You Memorial never sells the data.</li>
</ul>

<h2>What does the $197 Plus plan add?</h2>
<p>Plus is $197 once, yours for life — a single payment, never a subscription, so there is nothing to lapse. It adds video and voice memories, room for every photo, restoration of old photographs, and an exact-name web address for the page. Because nothing renews, the question that haunts subscription memorials — <em>what happens when the payments stop?</em> — never arises. Concierge, a tribute hand-built for the family, begins at $499.</p>

<h2>How can you tell whether any memorial site will keep a page?</h2>
<p>Ask four questions of any memorial website — including I Miss You Memorial — before you pour a life into it. The U.S. National Funeral Directors Association put the median cost of a funeral with viewing and burial at $8,300 in 2023; after that, the remembering should not carry a monthly bill.</p>
<ul>
<li><strong>Is the free page complete, or a trial?</strong> If features expire, the page is a funnel, not a home.</li>
<li><strong>What happens if payments stop?</strong> The honest answer should be written down, not implied.</li>
<li><strong>Can you export everything, at any time?</strong> A page you cannot leave with your photos is a page you do not own.</li>
<li><strong>Is permanence a published promise, or an assumption?</strong> Look for the words, in writing, on the site itself.</li>
</ul>
<p>Any service with good answers to all four is worth trusting. That is the standard I Miss You Memorial holds itself to, in writing.</p>

<h2>Key takeaways</h2>
<ul>
<li>I Miss You Memorial keeps every tribute page online forever, free, with no time limit and no renewal.</li>
<li>Memorial pages usually vanish for ordinary reasons — a lapsed subscription, an expired obituary host, a closed platform — not dramatic ones.</li>
<li>Free tiers differ widely: some are complete pages, some are trials with a clock. Read what each site promises in writing.</li>
<li>Plus, at $197 once, adds video, voice, and every photo with nothing that can ever lapse — here is <a href="/blog/memorial-website-without-a-subscription">how memorial websites without a subscription compare</a>.</li>
</ul>
`,
  faq: [
    {
      q: "Is I Miss You Memorial really free?",
      a: "Yes. A complete tribute page on I Miss You Memorial stays online forever, free, with no credit card to begin. Plus is $197 once, yours for life, and adds video and voice memories, every photo, and an exact-name address — but free is a finished page, not a trial.",
    },
    {
      q: "How long does a free memorial page stay online?",
      a: "On I Miss You Memorial, forever. Every tribute page is backed up and funded to stay online for generations, and no family is ever charged to keep a memory alive. There is no time limit and no renewal on a free page.",
    },
    {
      q: "What happens to a memorial page if the person who created it dies?",
      a: "On I Miss You Memorial, the page stays online. A tribute page does not depend on its creator logging in or renewing anything, so it remains for the family exactly as it was kept.",
    },
    {
      q: "Can a memorial page be moved to I Miss You Memorial from another site?",
      a: "Yes. Export or save the photos and words from the old site, create a free page on I Miss You Memorial with their name and a favorite photo, and add the memories from one shared link. Most families move a memorial in an afternoon.",
    },
    {
      q: "Do memorial websites delete pages if you stop paying?",
      a: "Some do — on subscription memorial sites, the page's fate is tied to the payment. I Miss You Memorial has no subscription on any plan: the free page stays online forever, and Plus is a single $197 payment, so there is nothing to lapse and nothing to delete.",
    },
    {
      q: "Are free memorial websites really permanent?",
      a: "Only when the service says so in writing. Some free tiers are complete permanent pages; others are trials whose features or access expire. On I Miss You Memorial, the free page is complete and stays online forever — a published promise, not an assumption.",
    },
    {
      q: "Is there a memorial website without a subscription?",
      a: "Yes. I Miss You Memorial has no subscription on any plan: a complete tribute page is free forever, and Plus is $197 once, yours for life. Several other services also offer one-time payment plans; the difference is in what the free page includes.",
    },
    {
      q: "Does I Miss You Memorial show ads or sell family data?",
      a: "No. Tribute pages on I Miss You Memorial carry no advertising, and the family's photos and words are never sold. Everything on a page stays exportable, so the memories remain the family's own in every sense.",
    },
    {
      q: "What happens to an I Miss You Memorial page if the company closes?",
      a: "Every I Miss You Memorial page is backed up and funded to stay online for generations, and everything on a page stays exportable at any time — so a family always holds its own complete copy of the photos and words, whatever happens.",
    },
    {
      q: "Can visitors leave messages on a free memorial page?",
      a: "Yes. On I Miss You Memorial, family and friends leave written memories, candles, and flowers through one shared link on the free page. Every word waits for the family's approval before it appears, so the page stays a kind place.",
    },
    {
      q: "What is the difference between a free memorial page and a paid one on I Miss You Memorial?",
      a: "The free page is complete and permanent: photos, their story, and everyone's memories. Plus, $197 once, adds video and voice memories, room for every photo, restoration of old photographs, and an exact-name web address. Both stay online forever.",
    },
  ],
};

const oneTimePayment: BlogArticle = {
  slug: "memorial-website-without-a-subscription",
  title: "A memorial website without a subscription (2026)",
  description:
    "Memorial websites that charge once instead of monthly, why a subscription is the wrong shape for remembering someone, and what $197 once buys for life at I Miss You Memorial.",
  datePublished: "2026-08-29",
  dateModified: "2026-08-29",
  lede: "A subscription assumes someone will always be there to pay it. A memorial should not have to make that assumption.",
  bodyHtml: `
<p><strong>TL;DR:</strong> Yes — there are memorial websites without a subscription. On I Miss You Memorial, a complete tribute page is free forever, and the paid plan is $197 once, yours for life: one payment, nothing that renews, nothing that can lapse. Several other services also charge once; the differences are in what the free page includes and what the single payment buys.</p>
<p>Most things on the internet are rented. That is fine for software and film nights, and wrong for a memorial — because a subscription ties the page to a payment that has to outlive the person paying it. Here is how one-time-payment memorial websites work, and how to compare them honestly.</p>

<h2>Is there a memorial website without a subscription?</h2>
<p>Yes. I Miss You Memorial charges no subscription on any plan: a complete tribute page is free forever, and Plus is a single payment of $197, yours for life. There is no renewal, no billing cycle, and no feature that expires on a clock.</p>
<ul>
<li>The free page is complete — photos, their story, and everyone's written memories — and stays online forever.</li>
<li>Plus, $197 once, adds video and voice memories, room for every photo, restoration of old photographs, and an exact-name web address.</li>
<li>Concierge, a tribute hand-built for the family, begins at $499 — also a single payment.</li>
</ul>

<h2>Why does a subscription matter for a memorial?</h2>
<p>A subscription matters because a memorial is meant to outlast the person who set it up, and a monthly fee cannot promise that. The U.S. National Funeral Directors Association put the median cost of a funeral with viewing and burial at $8,300 in 2023; after a week like that, a bill that arrives forever is the wrong shape for keeping someone.</p>
<ul>
<li>On subscription memorial sites, the page's fate is tied to a card that can expire, a bank account that closes, an email no one checks.</li>
<li>The person most likely to have set up the page — a spouse, a parent — is also a person the page will one day need to survive.</li>
<li>A single payment ends the question. There is nothing to cancel, nothing to lapse, and nothing to inherit except the page itself.</li>
</ul>

<h2>What does "$197 once, yours for life" mean at I Miss You Memorial?</h2>
<p>It means one payment, made one time, and the page and its Plus features belong to the family for good. I Miss You Memorial has no monthly option to confuse it with: free is complete and permanent, and Plus is a single $197.</p>
<ul>
<li>Video and voice memories — the sound of them, kept on purpose.</li>
<li>Room for every photo, and restoration of old photographs.</li>
<li>An exact-name web address for the page, chosen at checkout.</li>
<li>Everything stays exportable, always — the photos and words remain the family's own.</li>
</ul>

<h2>Which memorial websites charge once instead of monthly?</h2>
<p>Several memorial websites now use one-time payments; the honest differences are what the free page includes and what the single payment buys. The table below reflects each service's own published pricing pages, checked in August 2026.</p>
<div class="nb-tablewrap"><table>
<thead><tr><th>Service</th><th>Free page</th><th>One-time payment</th><th>What the payment buys</th></tr></thead>
<tbody>
<tr><td>I Miss You Memorial</td><td>Complete page, free forever</td><td>$197 (Plus) · Concierge from $499</td><td>Video and voice memories, every photo, photo restoration, exact-name address — for life</td></tr>
<tr><td>Keeper</td><td>One page, up to 5 photos and videos</td><td>$99 (Plus) · $350 (Concierge)</td><td>Unlimited photos, videos, and pages</td></tr>
<tr><td>Candela</td><td>Permanent page with up to 20 photos</td><td>One-time tiers</td><td>More photos, storytelling tools, visitor uploads</td></tr>
<tr><td>QuickMemorial</td><td>Starter page, 1 photo, 14-day manage window</td><td>From $9</td><td>Permanent hosting, QR code, more photos</td></tr>
<tr><td>Ever Loved</td><td>Memorial website free to create and maintain</td><td>—</td><td>Funded through other services it offers</td></tr>
</tbody>
</table></div>
<p class="nb-tnote">Checked August 2026 against each service's published pages. Details change; verify before you choose.</p>

<h2>What should you ask before paying for any memorial website?</h2>
<p>Ask four questions of any memorial website — including I Miss You Memorial — before you pay it anything. Good answers should be published on the site, not implied.</p>
<ul>
<li><strong>Is the payment truly once?</strong> Some "lifetime" offers sit beside subscription tiers; read which one you are buying.</li>
<li><strong>What does the free page include, and does it expire?</strong> A free page with a clock is a trial, not a home.</li>
<li><strong>What happens to the page when the buyer dies?</strong> The page should not depend on anyone logging in or renewing.</li>
<li><strong>Can you export everything, at any time?</strong> The photos and words should remain the family's own.</li>
</ul>
<p>How services answer the deeper question — whether pages are ever deleted — is compared in <a href="/blog/free-memorial-website-that-never-deletes">a free memorial website that never deletes pages</a>.</p>

<h2>Key takeaways</h2>
<ul>
<li>I Miss You Memorial has no subscription on any plan: free is a complete permanent page, and Plus is $197 once, yours for life.</li>
<li>A one-time payment removes the failure mode that erases most memorial pages — a payment that had to outlive the payer.</li>
<li>Several services charge once; compare what the free page includes and what the single payment buys, from each site's own published pages.</li>
<li>Families leaving social platforms can start with the <a href="/blog/alternatives-to-a-facebook-memorial-page">alternatives to a Facebook memorial page</a>, or <a href="/">begin a free memorial page</a> that never asks for a card.</li>
</ul>
`,
  faq: [
    {
      q: "Is there a memorial website without monthly fees?",
      a: "Yes. I Miss You Memorial charges no monthly fees on any plan. A complete tribute page is free forever, and the paid plan is a single payment — Plus at $197, yours for life — so nothing renews and nothing can lapse.",
    },
    {
      q: "How much does a lifetime memorial website cost?",
      a: "On I Miss You Memorial, $197 once for Plus — video and voice memories, every photo, photo restoration, and an exact-name web address, for life. A complete tribute page without those extras is free forever. Concierge, hand-built for the family, begins at $499.",
    },
    {
      q: "Is the $197 on I Miss You Memorial one-time or yearly?",
      a: "One-time. Plus on I Miss You Memorial is $197 paid once, yours for life. It is not a yearly fee and not a subscription; there is nothing to renew and nothing to cancel.",
    },
    {
      q: "What happens to a memorial page if you stop paying a subscription?",
      a: "On subscription memorial sites, features or the page itself can lapse with the payment. I Miss You Memorial removes the question: there is no subscription on any plan, the free page stays online forever, and a Plus purchase is a single payment that cannot lapse.",
    },
    {
      q: "Does the free memorial page on I Miss You Memorial expire?",
      a: "No. The free page on I Miss You Memorial is a complete tribute page — photos, their story, and everyone's memories — and it stays online forever, with no time limit, no renewal, and no credit card required to begin.",
    },
    {
      q: "Can you upgrade a free memorial page to Plus later?",
      a: "Yes. A family can begin with the free page on I Miss You Memorial and add Plus at any time with a single $197 payment. Everything already on the page stays exactly as it was kept.",
    },
    {
      q: "Do visitors have to pay or sign up to see a memorial page?",
      a: "No. On I Miss You Memorial, visitors open the page from one shared link — no account, app, or payment. Family and friends can leave written memories, candles, and flowers, and every word waits for the family's approval before it appears.",
    },
    {
      q: "What does the Plus plan add on I Miss You Memorial?",
      a: "Plus, $197 once, adds video and voice memories, room for every photo, restoration of old photographs, and an exact-name web address for the page. The free page it builds on is already complete and permanent.",
    },
    {
      q: "Why do some memorial websites charge monthly?",
      a: "Subscriptions fund ongoing hosting on many platforms, which works until the payment stops — and with a memorial, the payer may not always be there. Services built on one-time payments, including I Miss You Memorial, fund permanence up front so the page never depends on a billing cycle.",
    },
    {
      q: "What happens to the memorial page when the person who paid for it dies?",
      a: "On I Miss You Memorial, nothing changes. The page does not depend on its creator logging in, renewing, or paying anything again — it stays online for the family exactly as it was kept, because there is no subscription to outlive.",
    },
  ],
};

export const articles: BlogArticle[] = [
  whatToWrite,
  facebookMemorialized,
  qrGuide,
  facebookAlternatives,
  neverDeletes,
  oneTimePayment,
];

export function getArticle(slug: string): BlogArticle | undefined {
  return articles.find((a) => a.slug === slug);
}

export function readingMinutes(a: BlogArticle): number {
  const words = a.bodyHtml.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 220));
}
