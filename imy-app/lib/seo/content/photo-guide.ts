export const content = {
  slug: "restoring-old-family-photos",
  intro:
    "An old photograph can usually give back more than it seems to hold. Fading, scratches, and small tears can be mended; detail the camera never captured cannot. This is an honest guide to what restoration can do, and to scanning a printed photo well with nothing but a phone.",
  sections: [
    {
      heading: "What restoration can truly recover",
      body: [
        "Fading and color shift respond best. A print that has gone orange or pale almost always has more information in it than the eye can see, and restoration brings it back. Scratches, dust, creases, and small tears across backgrounds mend cleanly. Water spots and mildew marks can usually be lifted. Mild blur can be softened, though not reversed.",
        "What no tool can do is recover detail that was never captured. A face that is a blur of eight pixels is not hiding a sharp face underneath. Be wary of any tool that promises otherwise.",
      ],
    },
    {
      heading: "A word of honesty about faces",
      body: [
        "Modern restoration tools reconstruct faces rather than merely cleaning them, and a reconstruction can drift. A jaw slightly changed, an expression slightly wrong. For a portrait that will stand on a memorial, every restored face should be checked by someone who knew the person. If it does not look like them, it is not them, and the original is the truer keepsake. We keep restored and original side by side, never replacing one with the other.",
      ],
    },
    {
      heading: "Scanning a print with only a phone",
      body: ["Most family photos are rescued at a kitchen table with a phone. Done carefully, a phone capture is enough for restoration and printing."],
      list: {
        title: "The kitchen table method",
        items: [
          "Work in indirect daylight near a window, never with flash",
          "Lay the photo flat and shoot square on, directly above it, so the print's edges stay parallel",
          "Fill the frame with the photo and let the camera focus before you shoot",
          "Use the highest quality setting your phone offers",
          "One photograph per shot, not the whole album page",
          "Wipe dust from the print with a dry, soft cloth only, and never anything damp",
          "For a photo stuck under album plastic, do not force it; shoot through the plastic at a slight angle to dodge the glare",
        ],
      },
    },
    {
      heading: "If you have a flatbed scanner",
      body: [
        "Scan at 300 dpi for prints you want to reprint at the same size, 600 dpi for small prints you hope to enlarge. Turn every auto-enhance setting off; restoration wants the honest scan, not the scanner's opinion. Save as the largest file the scanner offers.",
      ],
    },
    {
      heading: "Caring for the originals",
      body: [
        "Cool, dry, and dark keeps photographs alive. Acid-free boxes or sleeves if you can, an ordinary box away from the attic and the basement if you cannot. Never tape, never glue, never a rubber band around a stack. Write names on the back lightly in pencil, at the edge. Someone in fifty years will bless you for it.",
      ],
    },
    {
      heading: "What comes next",
      body: [
        "Our free photo restoration tool is being prepared with the same care as everything else here. When it opens, a scanned photo can be mended in the browser and placed on their memorial page, restored and original together.",
      ],
    },
  ],
  faq: [
    {
      q: "Can a badly blurred face be fixed?",
      a: "Softened, sometimes. Truly recovered, no. Detail the camera never captured cannot be brought back, only invented, and an invented face is not your person. An honest restoration keeps what is real.",
    },
    {
      q: "Should I restore the only copy of a photo?",
      a: "Restoration is done on a scan, never on the print itself. The original never leaves your hands. Scan it well once and it is safe forever.",
    },
    {
      q: "What resolution do I need for the Memorial Stone portrait?",
      a: "A sharp phone capture in daylight is almost always enough. If the print is smaller than a playing card, scan or shoot it as large and steady as you can and let restoration do the rest.",
    },
  ],
  downloadNote: "print the scanning guide · the kitchen table method",
  makerVariant: "default",
  toolSlug: "print",
  toolLabel: "Print the scanning guide",
} as const;
