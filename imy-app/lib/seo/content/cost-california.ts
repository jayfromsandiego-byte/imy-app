export const content = {
  slug: "funeral-costs/california",
  intro:
    "There is no official statewide median funeral cost for California. The closest honest number is regional. In the NFDA's 2023 study, the Pacific census division, which includes California, had a median of $7,835 for a funeral with viewing and burial and $5,812 for a funeral with viewing and cremation.",
  sections: [
    {
      heading: "What a funeral costs in California",
      body: [
        "Nationally, the median cost of an adult funeral with viewing and burial was $8,300 in 2023, and a funeral with viewing and cremation was $6,280, according to the National Funeral Directors Association's General Price List study. Those figures cover the funeral home's goods and services. They do not include the cemetery plot, interment, a marker, or cash items like flowers and the obituary.",
        "NFDA publishes medians by census division, not by state. California sits in the Pacific division, where the 2023 median was $7,835 for a funeral with viewing and burial and $5,812 for a funeral with viewing and cremation. Anyone quoting a precise California statewide average is estimating; no credible body publishes one.",
        "Prices also vary a great deal from one funeral home to the next, even in the same town. The itemized national medians below are a fair starting point for reading a price list.",
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
      heading: "California's own rules",
      body: [
        "California does not require embalming in most cases. If final disposition will not happen within 24 hours, the body must be embalmed or refrigerated, and state law makes an exception for families conducting home funerals (Cal. Health & Safety Code section 7304 and 16 CCR section 1223). Shipping a body by common carrier requires embalming or an approved sealed container (Cal. Health & Safety Code section 7355).",
        "California has no law requiring that a licensed funeral director be involved in making or carrying out final arrangements, though a disposition permit is still required.",
        "Home burial is where California is stricter than most states. Bodies must be buried in established cemeteries (Cal. Health & Safety Code section 8115). Burial on private land is possible only if a family cemetery can be established through municipal or county zoning, which is realistic mainly in rural areas. California's rules on what may be done with cremated remains are also described as the strictest in the nation.",
        "The state's Cemetery and Funeral Bureau publishes a free Consumer Guide to Funeral and Cemetery Purchases and offers a license lookup at search.dca.ca.gov. State law also prohibits charging a fee for handling a casket you bought elsewhere.",
      ],
    },
    {
      heading: "Your rights under the Funeral Rule",
      body: [
        "The FTC's Funeral Rule applies in California as it does everywhere in the country. A funeral home must give you a written, itemized General Price List that is yours to keep, and must give prices over the phone without asking for your name or contact details. You have the right to buy only what you want rather than a package, to supply a casket or urn from anywhere without a handling fee, and to know that embalming is not required by federal law and that no state or local law requires a casket for cremation.",
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
      q: "Can we bury someone on our own land in California",
      a: "Generally no. California law requires burial in an established cemetery (Cal. Health & Safety Code section 8115). Burial on private land is possible only where a family cemetery can be established through municipal or county zoning, which mainly happens in rural areas.",
    },
    {
      q: "Do we need a funeral director in California",
      a: "No. California has no law requiring a licensed funeral director to make or carry out final arrangements. You still need a disposition permit before burial or cremation.",
    },
    {
      q: "Does California require embalming",
      a: "Not in most cases. If final disposition will not occur within 24 hours, the body must be embalmed or refrigerated, with an exception for families conducting home funerals (Cal. Health & Safety Code section 7304; 16 CCR section 1223). Refrigeration is an accepted alternative.",
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
      label: "California Cemetery and Funeral Bureau, Consumer Guide to Funeral and Cemetery Purchases",
      url: "https://www.cfb.ca.gov/consumer/consumer_guide.pdf",
    },
    {
      label: "Nolo, Burial and Cremation Laws in California",
      url: "https://www.nolo.com/legal-encyclopedia/burial-cremation-laws-california.html",
    },
    {
      label: "Nolo, California Home Funeral Laws",
      url: "https://www.nolo.com/legal-encyclopedia/california-home-funeral-laws.html",
    },
    {
      label: "Funeral Consumers Alliance, Your Funeral Rights",
      url: "https://www.funerals.org/your-rights/ftc-funeral-rule/your-funeral-rights/",
    },
  ],
} as const;
