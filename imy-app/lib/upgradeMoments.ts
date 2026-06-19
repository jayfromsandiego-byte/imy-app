// Gentle upgrade moments for I Miss You Memorial.
// Shown ONLY when a free user reaches a real limit — never on a timer, never before.
// Each is one soft offer, always dismissible, and always reassures that what they've
// already made stays free, forever.

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

// Stripe checkout links (already redirect to onboarding after payment).
const PLUS = "https://buy.stripe.com/eVqbJ06kIdxlbwCc2E9AA0h";
const ETERNAL = "https://buy.stripe.com/7sY00i8sQ3WL9oufeQ9AA0j";

export const UPGRADE_MOMENTS: Record<MomentId, Moment> = {
  photos: {
    eyebrow: "Your gallery is full — for now",
    title: "Room for every photograph",
    body: "You've gathered fifty. Already a beautiful gallery. If there are more moments you'd like to keep, Plus opens the gallery without limit — so none of them has to be left out.",
    primaryLabel: "Add unlimited photos · Plus, $59 once",
    primaryHref: PLUS,
    secondaryLabel: "Not now",
    reassure: "The fifty you've added stay, always.",
  },
  videos: {
    eyebrow: "You've added five videos",
    title: "More of their voice, their motion",
    body: "Five films already. With Plus you can add as many as you have — their laugh, their stories, the way they moved through a room.",
    primaryLabel: "Add unlimited videos · Plus, $59 once",
    primaryHref: PLUS,
    secondaryLabel: "Not now",
    reassure: "What you've added stays, always.",
  },
  theme: {
    eyebrow: "A theme from Plus",
    title: "Another shade of beautiful",
    body: "Your page is lovely as it is. This design is one of the seven that come with Plus — all ten themes, yours to change anytime.",
    primaryLabel: "Unlock all themes · Plus, $59 once",
    primaryHref: PLUS,
    secondaryLabel: "Keep my theme",
    reassure: "Your current theme is free, forever.",
  },
  memories: {
    eyebrow: "Twenty-five memories shared",
    title: "So everyone can speak",
    body: "What a gathering already. Plus removes the limit, so no one who loved them is ever turned away from leaving a memory.",
    primaryLabel: "Welcome everyone · Plus, $59 once",
    primaryHref: PLUS,
    secondaryLabel: "Not now",
    reassure: "Every memory already shared stays.",
  },
  restore: {
    eyebrow: "This photograph has seen some years",
    title: "Gently bring it back",
    body: "Plus can quietly restore faded, creased, or damaged photographs — softly, never changing who they were. You approve every one before it appears.",
    primaryLabel: "Restore this photo · Plus, $59 once",
    primaryHref: PLUS,
    secondaryLabel: "Leave it as it is",
    reassure: "The original is always kept, untouched.",
  },
  writing: {
    eyebrow: "When the words are hard",
    title: "We can help you begin",
    body: "Grief makes sentences difficult. Plus can offer a gentle first draft from a few details — yours to keep, change, or set aside entirely.",
    primaryLabel: "Help me write · Plus, $59 once",
    primaryHref: PLUS,
    secondaryLabel: "I'll write it myself",
    reassure: "Nothing is ever published without you.",
  },
  eternal: {
    eyebrow: "For the deepest assurance",
    title: "Kept for fifty years, guaranteed",
    body: "Their page is already here for good. Eternal adds a fifty-year written guarantee, an archival backup, a slideshow keepsake, and a gift to a charity in their name.",
    primaryLabel: "Choose Eternal · $199 once",
    primaryHref: ETERNAL,
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
