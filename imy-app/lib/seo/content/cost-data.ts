// Funeral cost line items — NATIONAL MEDIANS with sources.
// HOUSE RULE: no number without a source. Every figure below was verified
// against the primary NFDA PDFs on 2026-08-13 (see imy-app/docs or the
// studio research file for provenance). Medians, never quotes — the family's
// real number is their funeral home's General Price List, which the FTC
// Funeral Rule entitles them to, including over the phone.
//
// NFDA 2023 GPL Study (latest published as of Aug 2026):
//   https://content.nfda.org/Portals/0/12-8-2023--2023%20GPL%20Survey.pdf
// NFDA 2021 GPL Final Report (for lines absent from the 2023 release):
//   https://kff.org/wp-content/uploads/sites/3/2022/09/2021-General-Price-List-Final-Report.pdf
// Note: the 2023 PDF prints the basic services fee as $2,459 in one table and
// $2,495 in another for the same line (+8.5% on 2021's $2,300 = $2,495.50).
// We use $2,495, the arithmetically consistent figure; the guide footnotes this.

export type CostPath = "burial-viewing" | "direct-burial" | "cremation-service" | "direct-cremation";

export interface CostItem {
  id: string;
  label: string;
  note?: string;
  /** Median in USD, or null when no verified figure exists. */
  medianUsd: number | null;
  year: string;
  sourceLabel: string;
  defaultOn: CostPath[];
  offeredOn: CostPath[];
}

export const COST_ITEMS: CostItem[] = [
  { id: "basic", label: "Basic services fee", note: "The one fee that cannot be declined", medianUsd: 2495, year: "2023", sourceLabel: "NFDA", defaultOn: ["burial-viewing", "direct-burial", "cremation-service", "direct-cremation"], offeredOn: ["burial-viewing", "direct-burial", "cremation-service", "direct-cremation"] },
  { id: "transfer", label: "Transfer of remains", medianUsd: 395, year: "2023", sourceLabel: "NFDA", defaultOn: ["burial-viewing", "direct-burial", "cremation-service", "direct-cremation"], offeredOn: ["burial-viewing", "direct-burial", "cremation-service", "direct-cremation"] },
  { id: "embalming", label: "Embalming", note: "Not required by federal law; homes often require it for a public viewing; refrigeration is usually an alternative", medianUsd: 845, year: "2023", sourceLabel: "NFDA", defaultOn: ["burial-viewing"], offeredOn: ["burial-viewing", "cremation-service"] },
  { id: "prep", label: "Other preparation", note: "Dressing, casketing, cosmetology", medianUsd: 295, year: "2023", sourceLabel: "NFDA", defaultOn: ["burial-viewing"], offeredOn: ["burial-viewing", "cremation-service"] },
  { id: "viewing", label: "Facilities and staff for viewing", medianUsd: 475, year: "2023", sourceLabel: "NFDA", defaultOn: ["burial-viewing"], offeredOn: ["burial-viewing", "cremation-service"] },
  { id: "ceremony", label: "Facilities and staff for ceremony", medianUsd: 550, year: "2023", sourceLabel: "NFDA", defaultOn: ["burial-viewing", "cremation-service"], offeredOn: ["burial-viewing", "direct-burial", "cremation-service"] },
  { id: "hearse", label: "Hearse", medianUsd: 375, year: "2023", sourceLabel: "NFDA", defaultOn: ["burial-viewing"], offeredOn: ["burial-viewing", "direct-burial"] },
  { id: "servicecar", label: "Service car or van", medianUsd: 175, year: "2023", sourceLabel: "NFDA", defaultOn: [], offeredOn: ["burial-viewing", "direct-burial", "cremation-service"] },
  { id: "printed", label: "Printed materials", note: "Programs and cards. Our free program maker can replace this line entirely.", medianUsd: 195, year: "2023", sourceLabel: "NFDA", defaultOn: [], offeredOn: ["burial-viewing", "cremation-service"] },
  { id: "casket", label: "Metal burial casket", note: "The single most variable item. The Funeral Rule lets you buy one anywhere, with no handling fee.", medianUsd: 2500, year: "2023", sourceLabel: "NFDA", defaultOn: ["burial-viewing", "direct-burial"], offeredOn: ["burial-viewing", "direct-burial"] },
  { id: "vault", label: "Burial vault", note: "No state law requires one; many cemeteries do", medianUsd: 1695, year: "2023", sourceLabel: "NFDA", defaultOn: ["burial-viewing"], offeredOn: ["burial-viewing", "direct-burial"] },
  { id: "cremationcasket", label: "Cremation casket", note: "For a viewing before cremation. An alternative container is always allowed by law.", medianUsd: 1310, year: "2021", sourceLabel: "NFDA", defaultOn: ["cremation-service"], offeredOn: ["cremation-service"] },
  { id: "altcontainer", label: "Alternative cremation container", note: "Fiberboard or wood. No law anywhere requires a casket for cremation.", medianUsd: 160, year: "2023", sourceLabel: "NFDA", defaultOn: ["direct-cremation"], offeredOn: ["cremation-service", "direct-cremation"] },
  { id: "cremationfee", label: "Cremation fee", note: "Third-party crematory fee", medianUsd: 400, year: "2023", sourceLabel: "NFDA", defaultOn: ["cremation-service", "direct-cremation"], offeredOn: ["cremation-service", "direct-cremation"] },
  { id: "urn", label: "Urn", medianUsd: 295, year: "2023", sourceLabel: "NFDA", defaultOn: ["cremation-service"], offeredOn: ["cremation-service", "direct-cremation"] },
];

export interface CostSummary {
  label: string;
  figure: string;
  year: string;
  sourceLabel: string;
  sourceUrl: string;
}

export const COST_SUMMARIES: CostSummary[] = [
  { label: "Median funeral with viewing and burial", figure: "$8,300", year: "2023", sourceLabel: "NFDA GPL Study", sourceUrl: "https://content.nfda.org/Portals/0/12-8-2023--2023%20GPL%20Survey.pdf" },
  { label: "Median funeral with viewing and burial, with vault", figure: "$9,995", year: "2023", sourceLabel: "NFDA GPL Study", sourceUrl: "https://content.nfda.org/Portals/0/12-8-2023--2023%20GPL%20Survey.pdf" },
  { label: "Median funeral with viewing and cremation", figure: "$6,280", year: "2023", sourceLabel: "NFDA GPL Study", sourceUrl: "https://content.nfda.org/Portals/0/12-8-2023--2023%20GPL%20Survey.pdf" },
  { label: "Median direct cremation", figure: "$2,455 to $2,550", year: "2021", sourceLabel: "NFDA GPL Final Report", sourceUrl: "https://kff.org/wp-content/uploads/sites/3/2022/09/2021-General-Price-List-Final-Report.pdf" },
];

export const PATH_LABELS: Record<CostPath, { name: string; blurb: string }> = {
  "burial-viewing": { name: "Funeral with viewing and burial", blurb: "The traditional path. Viewing, ceremony, and burial." },
  "direct-burial": { name: "Direct burial", blurb: "Burial without a viewing or ceremony beforehand. A graveside gathering can still be held." },
  "cremation-service": { name: "Cremation with a service", blurb: "A viewing or ceremony first, then cremation." },
  "direct-cremation": { name: "Direct cremation", blurb: "Cremation soon after death, no viewing. A memorial can be held anytime, anywhere." },
};
