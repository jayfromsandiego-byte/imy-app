// lib/heroBackgrounds.ts — the hero's looping scenic backgrounds (July 29 2026).
// Ten quiet scenes. Each slot is three files under public/bg/ following one
// naming contract ({id}.webm · {id}.mp4 · {id}-poster.jpg), so a clip can be
// swapped later by replacing its files — never by touching a component.
export type HeroBackground = { id: string; label: string; poster: string; webm: string; mp4: string };

const slot = (id: string, label: string): HeroBackground => ({
  id,
  label,
  poster: `/bg/${id}-poster.jpg`,
  webm: `/bg/${id}.webm`,
  mp4: `/bg/${id}.mp4`,
});

// The open sky leads (r6, July 30): 'clouds' is the library's first slot and the
// default scene — the picker lists it first, and heroBackground() rests on it.
export const HERO_BACKGROUNDS: HeroBackground[] = [
  slot("clouds", "Open sky"),
  slot("campfire", "Campfire at dusk"),
  slot("ocean", "Ocean shore"),
  slot("ridgeline", "Mountain fog"),
  slot("canopy", "Forest light"),
  slot("lake", "Golden lake"),
  slot("wildflowers", "Wildflower field"),
  slot("snowfall", "Snowfall"),
  slot("starfield", "Night sky"),
  slot("rain", "Rain on glass"),
];

export const DEFAULT_HERO_BACKGROUND = "clouds";

/** The scene for a stored slot id. Unknown or absent ids rest on the open-sky default. */
export function heroBackground(id?: string | null): HeroBackground {
  return (
    HERO_BACKGROUNDS.find((b) => b.id === id) ||
    HERO_BACKGROUNDS.find((b) => b.id === DEFAULT_HERO_BACKGROUND) ||
    HERO_BACKGROUNDS[0]
  );
}
