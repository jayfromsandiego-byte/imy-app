// Content module types for catalog-driven SEO pages.

export interface ProgramSection {
  heading: string;
  body: string[];
  list?: { title?: string; items: string[] };
}

export interface ProgramPageContent {
  slug: string;
  /** 2-3 sentence direct-answer lede (AEO — quotable by assistants). */
  intro: string;
  sections: ProgramSection[];
  faq: { q: string; a: string }[];
  downloadNote: string;
  /** Preset passed to the program maker as ?variant= */
  makerVariant: string;
}
