import type { ProgramPageContent } from "./types";
import { content as adminExecutor } from "./admin-executor";
import { content as adminNotificationLetter } from "./admin-notification-letter";
import { content as adminSomeoneDies } from "./admin-someone-dies";
import { content as cardsCatholic } from "./cards-catholic";
import { content as cardsChristian } from "./cards-christian";
import { content as cardsHub } from "./cards-hub";
import { content as cardsSecular } from "./cards-secular";
import { content as cardsVerses } from "./cards-verses";
import { content as cardsYahrzeit } from "./cards-yahrzeit";
import { content as costAverage } from "./cost-average";
import { content as costArizona } from "./cost-arizona";
import { content as costIndiana } from "./cost-indiana";
import { content as costMassachusetts } from "./cost-massachusetts";
import { content as costMichigan } from "./cost-michigan";
import { content as costNewJersey } from "./cost-new-jersey";
import { content as costNorthCarolina } from "./cost-north-carolina";
import { content as costOhio } from "./cost-ohio";
import { content as costTennessee } from "./cost-tennessee";
import { content as costVirginia } from "./cost-virginia";
import { content as costWashington } from "./cost-washington";
import { content as costCalifornia } from "./cost-california";
import { content as costChecklist } from "./cost-checklist";
import { content as costFlorida } from "./cost-florida";
import { content as costGeorgia } from "./cost-georgia";
import { content as costIllinois } from "./cost-illinois";
import { content as costNewYork } from "./cost-new-york";
import { content as costPennsylvania } from "./cost-pennsylvania";
import { content as costTexas } from "./cost-texas";
import { content as eulogyFather } from "./eulogy-father";
import { content as eulogyFriend } from "./eulogy-friend";
import { content as eulogyHub } from "./eulogy-hub";
import { content as eulogyMother } from "./eulogy-mother";
import { content as obituaryFather } from "./obituary-father";
import { content as obituaryFriend } from "./obituary-friend";
import { content as obituaryGrandmother } from "./obituary-grandmother";
import { content as obituaryHub } from "./obituary-hub";
import { content as obituaryHusband } from "./obituary-husband";
import { content as obituaryInfant } from "./obituary-infant";
import { content as obituaryMother } from "./obituary-mother";
import { content as obituaryVeteran } from "./obituary-veteran";
import { content as obituaryWife } from "./obituary-wife";
import { content as photoGuide } from "./photo-guide";
import { content as poemsPrintable } from "./poems-printable";
import { content as poemsRainbow } from "./poems-rainbow";
import { content as poemsReadings } from "./poems-readings";
import { content as preneedBinder } from "./preneed-binder";
import { content as preneedWishes } from "./preneed-wishes";
import { content as programBaptist } from "./program-baptist";
import { content as programBifold } from "./program-bifold";
import { content as programCatholic } from "./program-catholic";
import { content as programCelebrationOfLife } from "./program-celebration-of-life";
import { content as programHub } from "./program-hub";
import { content as programJewish } from "./program-jewish";
import { content as programLds } from "./program-lds";
import { content as programMethodist } from "./program-methodist";
import { content as programMilitary } from "./program-military";
import { content as programOnePage } from "./program-one-page";
import { content as programOrderOfService } from "./program-order-of-service";
import { content as programPdf } from "./program-pdf";
import { content as programTrifold } from "./program-trifold";
import { content as programWord } from "./program-word";

const all = [
  adminExecutor,
  adminNotificationLetter,
  adminSomeoneDies,
  cardsCatholic,
  cardsChristian,
  cardsHub,
  cardsSecular,
  cardsVerses,
  cardsYahrzeit,
  costAverage,
  costArizona,
  costIndiana,
  costMassachusetts,
  costMichigan,
  costNewJersey,
  costNorthCarolina,
  costOhio,
  costTennessee,
  costVirginia,
  costWashington,
  costCalifornia,
  costChecklist,
  costFlorida,
  costGeorgia,
  costIllinois,
  costNewYork,
  costPennsylvania,
  costTexas,
  eulogyFather,
  eulogyFriend,
  eulogyHub,
  eulogyMother,
  obituaryFather,
  obituaryFriend,
  obituaryGrandmother,
  obituaryHub,
  obituaryHusband,
  obituaryInfant,
  obituaryMother,
  obituaryVeteran,
  obituaryWife,
  photoGuide,
  poemsPrintable,
  poemsRainbow,
  poemsReadings,
  preneedBinder,
  preneedWishes,
  programBaptist,
  programBifold,
  programCatholic,
  programCelebrationOfLife,
  programHub,
  programJewish,
  programLds,
  programMethodist,
  programMilitary,
  programOnePage,
  programOrderOfService,
  programPdf,
  programTrifold,
  programWord,
] as unknown as ProgramPageContent[];

const bySlug = new Map(all.map((c) => [c.slug, c]));

export function getContent(slug: string): ProgramPageContent | undefined {
  return bySlug.get(slug);
}
