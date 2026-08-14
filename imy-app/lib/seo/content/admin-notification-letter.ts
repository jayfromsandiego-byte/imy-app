export const content = {
  slug: "death-notification-letter",
  intro:
    "After a death, the same short letter has to be written again and again, to the bank, the electric company, the insurer. Writing it fresh each time is a small cruelty no one needs. These letters are ready. Copy them, fill in the bracketed parts, and send. They are polite, brief, and firm, which is exactly what these institutions respond to.",
  sections: [
    {
      heading: "How to use these letters",
      body: [
        "Copy the letter you need and replace everything in brackets, like [Full name] and [Account number], with your details. Keep the tone as written. You do not owe anyone a longer explanation than these letters give.",
        "Send a certified copy of the death certificate only when the institution requires one. Call or check their website first, because many companies, especially utilities and subscriptions, do not need it, and certified copies cost money and are better saved for the accounts that insist. When you do send one, send a certified copy, not your only original of anything, and note in your records which copy went where.",
        "Keep a copy of every letter you send, along with the date. If you mail anything important, consider a mailing method that gives you proof of delivery. Each letter below asks the institution to confirm receipt in writing, and you should hold them to that.",
      ],
    },
    {
      heading: "Letter to a bank",
      body: [
        "Dear Sir or Madam,",
        "I am writing to notify you of the death of [Full name], who passed away on [Date of death]. [He/She/They] held the following account(s) with your institution, including [Account number(s)].",
        "I am the [relationship to the deceased, for example spouse, child, or executor of the estate]. Please note the death on the account(s), freeze any activity as your procedures require, and let me know what documents you need from me to proceed. A certified copy of the death certificate [is enclosed / can be provided on request].",
        "Please also stop any automatic payments or transfers connected to the account(s) and send me a statement of the current balance(s).",
        "I would be grateful if you could confirm receipt of this letter in writing, and tell me the name and direct contact of the person handling this matter. Thank you for your care with this.",
        "Sincerely,",
        "[Your full name]",
        "[Your address]",
        "[Your phone number]",
        "[Date]",
      ],
    },
    {
      heading: "Letter to a utility or subscription service",
      body: [
        "Dear Sir or Madam,",
        "I am writing to inform you that [Full name], the account holder for [Account number] at [Service address, if applicable], passed away on [Date of death].",
        "Please [cancel the service / transfer the account into my name] effective [date]. I am the [relationship to the deceased]. If a final bill is due, please send it to the address below, and please refund any credit balance to the estate of [Full name].",
        "Please stop any automatic payments connected to this account. If you require any documentation from me, let me know exactly what you need and I will provide it.",
        "Please confirm receipt of this letter and the closing or transfer of the account in writing. Thank you.",
        "Sincerely,",
        "[Your full name]",
        "[Your address]",
        "[Your phone number]",
        "[Date]",
      ],
    },
    {
      heading: "Letter to an insurer",
      body: [
        "Dear Sir or Madam,",
        "I am writing to notify you of the death of [Full name], who passed away on [Date of death]. [He/She/They] held policy number [Policy number] with your company.",
        "I am the [relationship to the deceased, or beneficiary, or executor of the estate]. Please send me the forms and instructions needed to [file a claim under this policy / cancel this policy and refund any unearned premium to the estate]. A certified copy of the death certificate [is enclosed / will be provided with the claim].",
        "Please also confirm the status of the policy, whether premiums are paused pending your review, and whether any other policies are held in [Full name]'s name with your company.",
        "I would appreciate written confirmation that you have received this letter, along with the name and direct contact of the person assigned to this matter. Thank you.",
        "Sincerely,",
        "[Your full name]",
        "[Your address]",
        "[Your phone number]",
        "[Date]",
      ],
    },
  ],
  faq: [
    {
      q: "Do I need to send an original death certificate?",
      a: "Send certified copies, which you order through the funeral home or vital records, and only to institutions that require one. Ask each institution first. Many do not need one at all, and the ones that do will say so plainly.",
    },
    {
      q: "What if I do not know the account number?",
      a: "Send the letter anyway with the name, address, and date of death, and say the account number is unknown. Institutions can locate accounts from those details. The mail arriving at the house will surface most accounts within a month or two.",
    },
    {
      q: "Should I call instead of writing?",
      a: "Often you will do both. A call starts the process, and the letter creates a record. If an institution says a call is enough, you can still send the letter so there is a date on paper.",
    },
    {
      q: "What if they keep billing after I notify them?",
      a: "Reply with a copy of your original letter and its date, and ask again for written confirmation. Your kept copies are the whole point. If a bank or insurer will not respond, ask to escalate to their estates or bereavement department, which most large institutions have.",
    },
    {
      q: "Am I personally responsible for the bills?",
      a: "Generally debts belong to the estate, not to relatives, but there are exceptions such as joint accounts and cosigned loans, and the rules are state law. If anyone pressures you to pay personally, pause and check with an attorney first. This page is not legal advice.",
    },
  ],
  downloadNote: "printable letters · fill in the brackets and send",
  makerVariant: "default",
  toolSlug: "print",
  toolLabel: "Print this checklist",
} as const;
