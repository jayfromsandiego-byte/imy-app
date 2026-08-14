export const content = {
  slug: "funeral-costs/texas",
  intro:
    "No official statewide median funeral cost exists for Texas. The closest honest number is regional. In the NFDA's 2023 study, the West South Central census division, which includes Texas, had a median of $7,912 for a funeral with viewing and burial and $5,890 for a funeral with viewing and cremation.",
  sections: [
    {
      heading: "What a funeral costs in Texas",
      body: [
        "Nationally, the median cost of an adult funeral with viewing and burial was $8,300 in 2023, and a funeral with viewing and cremation was $6,280, according to the National Funeral Directors Association's General Price List study. Those figures cover the funeral home's goods and services only. The cemetery plot, interment, a marker, flowers, and the obituary are all extra.",
        "NFDA publishes medians by census division, not by state. Texas sits in the West South Central division, where the 2023 median was $7,912 for a funeral with viewing and burial and $5,890 for a funeral with viewing and cremation. Any page quoting a precise Texas statewide average is estimating; no credible body publishes one.",
        "Prices vary widely between funeral homes in the same city, so the itemized national medians below are most useful as a benchmark while you read a price list.",
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
      heading: "Texas's own rules",
      body: [
        "Texas does not require embalming. If final disposition will not happen within 24 hours, the body must be refrigerated, embalmed, or placed in an approved sealed container (25 Tex. Admin. Code section 181.4). Refrigeration is a lawful alternative to embalming.",
        "Texas does not require a licensed funeral director for making or carrying out final arrangements. State law lets the person in charge of interment file the death certificate (Tex. Health & Safety Code section 193.002).",
        "Home burial is allowed in Texas with conditions. A family cemetery must sit a minimum distance from the nearest city or municipality, scaled by that city's population (Tex. Health & Safety Code section 711.008). Graves must be at least 1.5 feet deep if the container is impenetrable, or 2 feet otherwise (section 714.001), and a plat or map of the family cemetery must be filed with the county clerk (section 711.034). Local zoning still applies, so check with the county first.",
      ],
    },
    {
      heading: "Your rights under the Funeral Rule",
      body: [
        "The FTC's Funeral Rule applies in Texas as it does everywhere in the country. A funeral home must give you a written, itemized General Price List that is yours to keep, and must give prices over the phone without asking who you are. You can decline packages and buy only what you want, supply a casket or urn from anywhere without a handling fee, and choose cremation with no casket at all. Embalming is not required by federal law, and the price list must say so next to the embalming price.",
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
      q: "Can we bury someone on our own land in Texas",
      a: "Yes, with conditions. A family cemetery must be a minimum distance from the nearest city, scaled by population (Tex. Health & Safety Code section 711.008), graves must meet depth rules of 1.5 or 2 feet depending on the container (section 714.001), and a plat of the cemetery must be filed with the county clerk (section 711.034). Check local zoning too.",
    },
    {
      q: "Does Texas require embalming",
      a: "No. If final disposition will not occur within 24 hours, the body must be refrigerated, embalmed, or placed in an approved sealed container (25 Tex. Admin. Code section 181.4). Refrigeration is an accepted alternative.",
    },
    {
      q: "Do we need a funeral director in Texas",
      a: "No. Texas does not require a licensed funeral director for making or carrying out final arrangements, and the person in charge of interment may file the death certificate (Tex. Health & Safety Code section 193.002).",
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
      label: "Nolo, Burial and Cremation Laws in Texas",
      url: "https://www.nolo.com/legal-encyclopedia/burial-cremation-laws-texas.html",
    },
    {
      label: "Nolo, Texas Home Funeral Laws",
      url: "https://www.nolo.com/legal-encyclopedia/texas-home-funeral-laws.html",
    },
    {
      label: "Funeral Consumers Alliance, Your Funeral Rights",
      url: "https://www.funerals.org/your-rights/ftc-funeral-rule/your-funeral-rights/",
    },
  ],
} as const;
