// Gentle upgrade moments for I Miss You Memorial.
// Shown ONLY when a free user reaches a real limit — never on a timer, never before.
// Each is one soft offer, always dismissible, and always reassures that what they've
// already made stays free, forever.
//
// Pricing (locked June 2026): Plus $97 once or $12/month. Concierge from $499 (done for you).
// Links route through in-app checkout (/dashboard/billing) — no hardcoded external pay links.

export type MomentId =
  | "photos"
  | "videos"
  | "theme"
  | "memories"
  | "restore"
  | "writing"
  | "eternal";

export type Moment = {
  eyebrow: string;
  title: string;
  body: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  reassure: string;
};

const PLUS = "/dashboard/billing";
const CONCIERGE = "mailto:imissyoumemorial@gmail.com?subject=Concierge";

export const UPGRADE_MOMENTS: Record<MomentId, Moment> = {
  photos: {
    eyebrow: "Your gallery is full — for now",
    title: "Room for every photograph",
    body: "You've gathered thirty. Already a beautiful gallery. If there are more moments you'd like to keep, Plus opens the gallery without limit — so none of them has to be left out.",
    primaryLabel: "Add unlimited photos · Plus, $97 once",
    primaryHref: PLUS,
    secondaryLabel: "Not now",
    reassure: "The photos you've added stay, always.",
  },
  videos: {
    eyebrow: "A moment in motion",
    title: "More of their voice, their motion",
    body: "With Plus you can add video and audio — their laugh, their stories, the way they moved through a room.",
    primaryLabel: "Add video & audio · Plus, $97 once",
    primaryHref: PLUS,
    secondaryLabel: "Not now",
    reassure: "What you've added stays, always.",
  },
  theme: {
    eyebrow: "A design from Plus",
    title: "Built around what they loved",
    body: "Your page is lovely as it is. Plus shapes the page around what they loved — a custom design drawn from their own interests.",
    primaryLabel: "Unlock the design · Plus, $97 once",
    primaryHref: PLUS,
    secondaryLabel: "Keep it as it is",
    reassure: "Your current page is free, forever.",
  },
  memories: {
    eyebrow: "So everyone can speak",
    title: "Welcome every memory",
    body: "What a gathering already. Plus keeps the door open, so no one who loved them is ever turned away from leaving a memory.",
    primaryLabel: "Welcome everyone · Plus, $97 once",
    primaryHref: PLUS,
    secondaryLabel: "Not now",
    reassure: "Every memory already shared stays.",
  },
  restore: {
    eyebrow: "This photograph has seen some years",
    title: "Gently bring it back",
    body: "Plus can quietly restore faded, creased, or damaged photographs — softly, never changing who they were. You approve every one before it appears.",
    primaryLabel: "Restore this photo · Plus, $97 once",
    primaryHref: PLUS,
    secondaryLabel: "Leave it as it is",
    reassure: "The original is always kept, untouched.",
  },
  writing: {
    eyebrow: "When the words are hard",
    title: "We can help you begin",
    body: "Grief makes sentences difficult. Plus can offer a gentle first draft from a few details — yours to keep, change, or set aside entirely.",
    primaryLabel: "Help me write · Plus, $97 once",
    primaryHref: PLUS,
    secondaryLabel: "I'll write it myself",
    reassure: "Nothing is ever published without you.",
  },
  // Done-for-you concierge (replaces the retired fixed-year "Eternal" tier).
  eternal: {
    eyebrow: "When you can't bear to build it",
    title: "Let us build it with you",
    body: "Hand us a few photos, a voicemail, the stories you tell. Our specialists craft a fully custom tribute, a memorial film, and keepsakes you can hold — ready before the service.",
    primaryLabel: "Concierge — from $499",
    primaryHref: CONCIERGE,
    secondaryLabel: "Stay with Plus",
    reassure: "There is never a fee to keep a memory online.",
  },
};

// "Once per limit per session" — honor a dismissal so we never nag.
export function hasSeenMoment(id: MomentId): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(`imy_moment_${id}`) === "1";
}

export function markMomentSeen(id: MomentId): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`imy_moment_${id}`, "1");
}
