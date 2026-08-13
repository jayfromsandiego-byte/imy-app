import type { ProgramPageContent } from "./types";
import { content as programHub } from "./program-hub";
import { content as programWord } from "./program-word";
import { content as programPdf } from "./program-pdf";
import { content as programBifold } from "./program-bifold";
import { content as programTrifold } from "./program-trifold";
import { content as programOnePage } from "./program-one-page";
import { content as programOrderOfService } from "./program-order-of-service";
import { content as programCelebrationOfLife } from "./program-celebration-of-life";
import { content as programCatholic } from "./program-catholic";
import { content as programBaptist } from "./program-baptist";
import { content as programMethodist } from "./program-methodist";
import { content as programLds } from "./program-lds";
import { content as programJewish } from "./program-jewish";
import { content as programMilitary } from "./program-military";

const all = [
  programHub,
  programWord,
  programPdf,
  programBifold,
  programTrifold,
  programOnePage,
  programOrderOfService,
  programCelebrationOfLife,
  programCatholic,
  programBaptist,
  programMethodist,
  programLds,
  programJewish,
  programMilitary,
] as unknown as ProgramPageContent[];

const bySlug = new Map(all.map((c) => [c.slug, c]));

export function getContent(slug: string): ProgramPageContent | undefined {
  return bySlug.get(slug);
}
