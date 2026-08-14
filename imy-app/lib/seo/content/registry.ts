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
import { content as obituaryHub } from "./obituary-hub";
import { content as obituaryMother } from "./obituary-mother";
import { content as obituaryFather } from "./obituary-father";
import { content as obituaryHusband } from "./obituary-husband";
import { content as obituaryWife } from "./obituary-wife";
import { content as obituaryGrandmother } from "./obituary-grandmother";
import { content as obituaryInfant } from "./obituary-infant";
import { content as obituaryFriend } from "./obituary-friend";
import { content as obituaryVeteran } from "./obituary-veteran";

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
  obituaryHub,
  obituaryMother,
  obituaryFather,
  obituaryHusband,
  obituaryWife,
  obituaryGrandmother,
  obituaryInfant,
  obituaryFriend,
  obituaryVeteran,
] as unknown as ProgramPageContent[];

const bySlug = new Map(all.map((c) => [c.slug, c]));

export function getContent(slug: string): ProgramPageContent | undefined {
  return bySlug.get(slug);
}
