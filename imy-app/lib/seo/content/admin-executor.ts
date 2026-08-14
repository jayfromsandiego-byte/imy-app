export const content = {
  slug: "executor-checklist",
  intro:
    "Someone trusted you with this. Being named executor, or personal representative, mostly means doing ordinary tasks in a sensible order and writing down what you did. This page is that order. Probate rules are state law and they differ from state to state, so treat this as a map of the territory, not the local road signs. It is not legal advice.",
  sections: [
    {
      heading: "Before probate opens",
      body: [
        "Your first job is to find the will, the most recent signed original if you can. Look in the home files, with the attorney who drafted it, or in a safe deposit box, though a box in the deceased's name alone may take extra steps to open. Read it before anything is distributed or discarded, because it may name you formally and may contain wishes that change your plans.",
        "Until the court gives you formal authority, your role is mostly protective. Secure the house and vehicles, keep insurance in force, and do not let anyone, however well meaning, start carrying things away. Order certified death certificates, since nearly every institution will ask for one. Then contact the probate court in the county where your person lived, or an attorney, to learn how your state opens an estate.",
      ],
      list: {
        title: "First steps",
        items: [
          "Locate the original will and any codicils",
          "Secure the home, vehicles, mail, and anything valuable or portable",
          "Keep homeowner and auto insurance active on estate property",
          "Order certified death certificates through the funeral home or vital records",
          "Contact the probate court clerk or an attorney about opening the estate",
          "Start a single folder or box where every estate paper will live",
        ],
      },
    },
    {
      heading: "The middle months",
      body: [
        "Once the court has appointed you, the steady work begins. Build an inventory of what the estate owns and owes. Bank statements, the mail, and tax returns will surface most of it. Open a bank account in the estate's name, move estate money into it, and pay estate expenses only from that account. Never mix estate money with your own, even briefly, even for convenience.",
        "State law directs how and when creditors must be notified, often including a published notice, and sets how long they have to make claims. The court clerk's office or an attorney can tell you exactly what your state requires. Through all of it, keep every receipt and note every decision. A simple ledger of money in, money out, and why, is the thing that makes the end of this job easy instead of hard.",
      ],
      list: {
        title: "Ongoing duties",
        items: [
          "Inventory assets and debts as your state requires",
          "Open an estate bank account and run all estate money through it",
          "Notify creditors in the manner state law directs",
          "Notify Social Security, insurers, banks, and agencies of the death",
          "File the final income tax return and any estate returns that apply",
          "Keep every receipt and a running ledger of what you did and why",
        ],
      },
    },
    {
      heading: "Closing the estate",
      body: [
        "When debts, taxes, and valid claims are handled, you distribute what remains according to the will. Get a signed receipt from each person who receives something. Then prepare the final accounting, which is the story your ledger has been writing all along, showing what came in, what went out, and what each beneficiary received.",
        "Depending on your state, the accounting goes to the court, to the beneficiaries, or both, and the court then releases you from the role. Do not distribute everything early just to make people happy. An executor who pays heirs before debts can end up personally responsible, and the timeline that protects you is the one state law sets.",
      ],
      list: {
        title: "Final steps",
        items: [
          "Distribute assets as the will directs and collect signed receipts",
          "Prepare the final accounting from your ledger",
          "File whatever your state requires to close the estate",
          "Keep the records for several years after closing, in case questions come later",
        ],
      },
    },
    {
      heading: "The document tracker",
      body: [
        "Print this list and check items off as you find them. You will not need every item, and some will not exist. The point is to look once, thoroughly, instead of hunting the same drawers for a year.",
      ],
      list: {
        title: "Documents to gather",
        items: [
          "Original will and any codicils or trust documents",
          "Certified death certificates",
          "Court papers appointing you, once issued",
          "Bank, brokerage, and retirement account statements",
          "Life insurance policies",
          "Deeds, mortgage papers, and property tax records",
          "Vehicle titles and registrations",
          "Recent income tax returns",
          "Marriage certificate, and divorce decree if any",
          "Military discharge papers if they served",
          "Outstanding bills, loan statements, and credit card statements",
          "Safe deposit box keys and any list of digital accounts",
        ],
      },
    },
    {
      heading: "A plain word about the law",
      body: [
        "Probate is governed by the law of the state where your person lived, and the details, from deadlines to which forms exist at all, vary widely. This page cannot tell you those specifics, and it should not try. The probate court clerk's office can tell you what filings your county expects, and a probate attorney can tell you what the law requires of you personally. For a modest estate, sometimes one paid hour of an attorney's time at the start is all you need. Neither this page nor any checklist is legal advice.",
      ],
    },
  ],
  faq: [
    {
      q: "Do I have to accept the role?",
      a: "No. You can decline, and the court will appoint the alternate named in the will or another qualified person. It is better to decline honestly than to serve resentfully or from too far away.",
    },
    {
      q: "Do I get paid for this?",
      a: "Most states allow executors reasonable compensation, and the will may say something about it. The amount and method are set by state law, so ask the court clerk or an attorney what applies where you are.",
    },
    {
      q: "How long does probate take?",
      a: "It varies with the estate and the state, from months to well over a year. The court and the notice periods in state law set the real pace. An attorney or the clerk's office can give you a realistic range for your situation.",
    },
    {
      q: "What if family members pressure me to distribute early?",
      a: "Point at the process, not at yourself. Debts, taxes, and claim periods come first by law, and distributing early can make you personally liable. It is fair to say that you will distribute as soon as the law allows and not before.",
    },
    {
      q: "Do I need an attorney?",
      a: "Not always, and some states have simplified procedures for small estates. But if there is real estate, a dispute, or anything confusing, an attorney is money well spent. The court clerk can explain procedure, though they cannot give legal advice, and neither can we.",
    },
  ],
  downloadNote: "printable tracker · no legal advice",
  makerVariant: "default",
  toolSlug: "print",
  toolLabel: "Print this checklist",
} as const;
