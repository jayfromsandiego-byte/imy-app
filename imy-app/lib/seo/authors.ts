// Authors registry — YMYL rule: every guide is signed by a real person.
//
// !! COPY NEEDED FROM KAYLA before any guide ships. Nothing here may be
// invented. Fill the [TO CONFIRM] fields with true, verifiable facts only.

export interface Author {
  slug: string;
  name: string;
  role: string;
  /** Short bio in the house voice. TRUE FACTS ONLY. */
  bio: string;
  /** Credentials relevant to grief/end-of-life content. Leave empty rather than invent. */
  credentials: string[];
  /** Ready to appear on published guides? Flip only after Kayla approves the copy. */
  published: boolean;
}

export const authors: Author[] = [
  {
    slug: "kayla",
    name: "Kayla", // [TO CONFIRM // full public name as she wants it printed]
    role: "Founder, I Miss You Memorial",
    bio: "[COPY NEEDED FROM KAYLA // two or three true sentences — why she built a place for keeping people close, in her own words]",
    credentials: [], // [TO CONFIRM // only real, verifiable credentials or lived-experience framing]
    published: false,
  },
];

export function getAuthor(slug: string): Author | undefined {
  return authors.find((a) => a.slug === slug);
}
