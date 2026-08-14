export const content = {
  slug: "funeral-costs/florida",
  intro:
    "No official statewide median funeral cost exists for Florida. The closest honest number is regional. In the NFDA's 2023 study, the South Atlantic census division, which includes Florida, had a median of $8,023 for a funeral with viewing and burial and $6,103 for a funeral with viewing and cremation.",
  sections: [
    {
      heading: "What a funeral costs in Florida",
      body: [
        "Nationally, the median cost of an adult funeral with viewing and burial was $8,300 in 2023, and a funeral with viewing and cremation was $6,280, according to the National Funeral Directors Association's General Price List study. Those figures cover the funeral home's goods and services only. The cemetery plot, interment, a marker, flowers, and the obituary are all extra.",
        "NFDA publishes medians by census division, not by state. Florida sits in the South Atlantic division, where the 2023 median was $8,023 for a funeral with viewing and burial and $6,103 for a funeral with viewing and cremation. Any page quoting a precise Florida statewide average is estimating; no credible body publishes one.",
        "Prices vary widely between funeral homes in the same town, so the itemized national medians below are most useful as a benchmark while you read a price list.",
      ],
      list: {
        title: "Key itemized national medians (NFDA, 2023)",
        items: [
          "Nondeclinable basic services fee, $2,495",
          "Metal burial casket, $2,500",
          "Vault, $1,695",
          "Embalming, $845",
          "Third-party cremation fee, $400",
        ],
      },
    },
    {
      heading: "Florida's own rules",
      body: [
        "Florida does not require embalming. If final disposition does not occur within 24 hours, the body must be embalmed or refrigerated (Fla. Stat. section 497.386). Refrigeration is a lawful alternative.",
        "On whether a funeral director is legally required, sources disagree, so we will be honest about that. Attorney-written guidance holds that Florida law allows a funeral without a funeral director, since a person in attendance at or after the death may file the death certificate (Fla. Stat. section 382.008(2)(a)), and Florida is not on the Funeral Consumers Alliance's list of nine states that require one. An older National Home Funeral Alliance summary, however, lists Florida among states requiring a funeral director to supervise disposition, and some Florida crematories require one as a matter of their own policy. If you plan to handle arrangements without a director, confirm with the Florida Division of Funeral, Cemetery and Consumer Services and with the crematory or cemetery first.",
        "Home burial is possible in Florida. No state law prohibits burial on private property, and families may establish a cemetery under 2 acres so long as burial rights are not sold (Fla. Stat. section 497.260). County and city zoning still applies.",
        "Two timing rules are worth knowing. A medical examiner must approve the cause of death before any cremation, and there is generally a 48-hour waiting period before cremation (Fla. Stat. sections 406.11 and 872.03).",
      ],
    },
    {
      heading: "Your rights under the Funeral Rule",
      body: [
        "The FTC's Funeral Rule applies in Florida as it does everywhere in the country. A funeral home must give you a written, itemized General Price List that is yours to keep, and must give prices over the phone without asking who you are. You can decline packages and buy only what you want, supply a casket or urn from anywhere without a handling fee, and choose cremation with no casket at all. Embalming is not required by federal law, and the price list must say so next to the embalming price.",
      ],
    },
    {
      heading: "Ways families keep costs kind",
      body: [
        "A few honest levers make the largest difference, and none of them make the goodbye smaller.",
      ],
      list: {
        items: [
          "Direct cremation, followed by a memorial you hold yourself, had a national median of $2,455 to $2,550 in the NFDA's 2021 study, depending on who provides the container.",
          "For cremation, an alternative container (fiberboard, cardboard, or unfinished wood) can stand in for a casket. The national median was $160 in 2023, next to $2,500 for a metal casket.",
          "Call two or three funeral homes and ask for prices by phone. The Funeral Rule requires them to answer, and medians hide wide local ranges.",
          "Make the printed program yourself. Our free program maker replaces the printed package line on the price list, which had a national median of $195 in 2023.",
        ],
      },
    },
  ],
  faq: [
    {
      q: "Do we need a funeral director in Florida",
      a: "The sources disagree, so we hedge. Attorney-written guidance says no, because a person in attendance at or after the death may file the death certificate (Fla. Stat. section 382.008(2)(a)), and Florida is not on the Funeral Consumers Alliance's nine-state list. An older National Home Funeral Alliance chart says a director must supervise disposition, and some crematories require one by policy. Confirm with the Florida Division of Funeral, Cemetery and Consumer Services before planning around either answer.",
    },
    {
      q: "How soon can cremation happen in Florida",
      a: "Generally not right away. A medical examiner must approve the cause of death before cremation, and there is generally a 48-hour waiting period (Fla. Stat. sections 406.11 and 872.03).",
    },
    {
      q: "Does Florida require embalming",
      a: "No. If final disposition does not occur within 24 hours, the body must be embalmed or refrigerated (Fla. Stat. section 497.386). Refrigeration is an accepted alternative.",
    },
  ],
  downloadNote: "work out your own estimate",
  makerVariant: "default",
  toolSlug: "funeral-cost-calculator",
  toolLabel: "Open the funeral cost calculator",
  sources: [
    {
      label: "NFDA 2023 General Price List Study",
      url: "https://content.nfda.org/Portals/0/12-8-2023--2023%20GPL%20Survey.pdf",
    },
    {
      label: "NFDA 2021 General Price List Final Report (direct cremation medians)",
      url: "https://kff.org/wp-content/uploads/sites/3/2022/09/2021-General-Price-List-Final-Report.pdf",
    },
    {
      label: "FTC, The FTC Funeral Rule",
      url: "https://consumer.ftc.gov/articles/ftc-funeral-rule",
    },
    {
      label: "Nolo, Burial and Cremation Laws in Florida",
      url: "https://www.nolo.com/legal-encyclopedia/burial-cremation-laws-florida.html",
    },
    {
      label: "Nolo, Florida Home Funeral Laws",
      url: "https://www.nolo.com/legal-encyclopedia/florida-home-funeral-laws.html",
    },
    {
      label: "Funeral Consumers Alliance, Your Funeral Rights",
      url: "https://www.funerals.org/your-rights/ftc-funeral-rule/your-funeral-rights/",
    },
    {
      label: "National Home Funeral Alliance, State Requirements (conflicting older summary)",
      url: "https://www.nhfuneral.org/state_home_funeral_requirements.html",
    },
  ],
} as const;
