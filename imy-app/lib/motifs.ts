// motifs.ts — Plus personalization motif library
// Maps a motifKey -> a tintable line-art asset in /public/personalization,
// plus a human label and alt text. The motifs are transparent PNG alpha-masks
// (single-color line art on a fully transparent ground) so they can be tinted to
// each theme's --accent via CSS mask (see .lt-trace in tribute-template.html).
//
// Adding a category later = (1) drop {key}.png into /public/personalization,
// (2) add a row here, (3) add any label synonyms below. No renderer changes.

export type Motif = { label: string; asset: string; alt: string };

export const MOTIFS: Record<string, Motif> = {
  // Tier 1
  gardening:      { label: "Gardening",         asset: "gardening.png",    alt: "A traced watering can, trowel and plants" },
  cars:           { label: "Cars & driving",    asset: "cars.png",         alt: "A traced classic sports car" },
  cooking:        { label: "Cooking & BBQ",     asset: "cooking.png",      alt: "A traced barbecue grill" },
  outdoors:       { label: "The outdoors",      asset: "outdoors.png",     alt: "A traced mountain peak and pines" },
  fishing:        { label: "Fishing",           asset: "fishing.png",      alt: "A traced fishing rod and fish" },
  golf:           { label: "Golf & sport",      asset: "golf.png",         alt: "A traced golf flag and clubs" },
  faith:          { label: "Faith",             asset: "faith.png",        alt: "A traced country chapel and cross" },
  "music-cello":  { label: "Music",             asset: "music-cello.png",  alt: "A traced cello" },
  "music-guitar": { label: "Music",             asset: "music-guitar.png", alt: "A traced acoustic guitar" },
  "music-piano":  { label: "Music",             asset: "music-piano.png",  alt: "A traced grand piano" },
  // Tier 2
  books:          { label: "Books & reading",   asset: "books.png",        alt: "A traced stack of books and reading glasses" },
  travel:         { label: "Travel",            asset: "travel.png",       alt: "A traced suitcase, compass and globe" },
  pets:           { label: "Dogs & pets",       asset: "pets.png",         alt: "A traced sitting dog with a bone" },
  sailing:        { label: "The sea & sailing", asset: "sailing.png",      alt: "A traced sailboat on the waves" },
  coffee:         { label: "Coffee",            asset: "coffee.png",       alt: "A traced coffee cup and moka pot" },
  woodworking:    { label: "Woodworking",       asset: "woodworking.png",  alt: "A traced hand plane and saw" },
  dancing:        { label: "Dancing",           asset: "dancing.png",      alt: "A traced pair of dance shoes" },
  knitting:       { label: "Knitting & crafts", asset: "knitting.png",     alt: "A traced ball of yarn and needles" },
  // Always-present neutral fallback for any label outside the library.
  fallback:       { label: "In memory",         asset: "fallback.png",     alt: "A delicate botanical flourish" },
};

// Normalize a dropdown/free label to a motif key. Unknown -> "fallback".
const SYNONYMS: Record<string, string> = {
  "gardening": "gardening", "garden": "gardening", "gardener": "gardening",
  "cars": "cars", "car": "cars", "cars & driving": "cars", "driving": "cars", "motorsport": "cars",
  "cooking": "cooking", "cooking & bbq": "cooking", "bbq": "cooking", "barbecue": "cooking", "grilling": "cooking", "baking": "cooking",
  "the outdoors": "outdoors", "outdoors": "outdoors", "hiking": "outdoors", "skiing": "outdoors", "snowboarding": "outdoors", "camping": "outdoors", "mountains": "outdoors",
  "fishing": "fishing", "angling": "fishing",
  "golf": "golf", "golf & sport": "golf", "sport": "golf", "sports": "golf",
  "faith": "faith", "church": "faith", "religion": "faith",
  "music": "music-cello", "cello": "music-cello", "strings": "music-cello", "violin": "music-cello",
  "guitar": "music-guitar", "music · guitar": "music-guitar",
  "piano": "music-piano", "music · piano": "music-piano", "keys": "music-piano",
  "books": "books", "books & reading": "books", "reading": "books", "literature": "books",
  "travel": "travel", "travelling": "travel", "traveling": "travel", "adventure": "travel",
  "dogs & pets": "pets", "pets": "pets", "dogs": "pets", "dog": "pets", "cats": "pets", "animals": "pets",
  "the sea & sailing": "sailing", "sailing": "sailing", "the sea": "sailing", "boating": "sailing", "the ocean": "sailing", "the beach": "sailing",
  "coffee": "coffee", "coffee & the kitchen table": "coffee", "tea": "coffee", "the kitchen table": "coffee",
  "woodworking": "woodworking", "woodworking / diy": "woodworking", "diy": "woodworking", "carpentry": "woodworking",
  "dancing": "dancing", "dance": "dancing", "ballet": "dancing",
  "knitting": "knitting", "knitting & crafts": "knitting", "crafts": "knitting", "crochet": "knitting", "sewing": "knitting",
};

export function labelToMotifKey(label = ""): string {
  const k = label.trim().toLowerCase();
  if (SYNONYMS[k]) return SYNONYMS[k];
  if (MOTIFS[k]) return k;
  return "fallback";
}
