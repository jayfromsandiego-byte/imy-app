export const content = {
  slug: "funeral-program/word",
  intro: "This is a free funeral program template you can edit in Microsoft Word. It is built so the layout survives your edits, which is the thing most Word templates fail at. Type over the placeholder text, print double-sided, fold once, and you are done.",
  sections: [
    {
      heading: "Why Word templates break, and how this one avoids it",
      body: [
        "Most funeral program templates found online break in the same three ways. The margins were drawn for a different paper size, so the fold line lands off center and the cover creases through the photo. The fold guides are actual printed lines that were never meant to appear on the finished program. And the template uses a font you do not own, so Word silently substitutes another one and every line reflows, pushing the order of service onto the wrong panel.",
        "This template is measured for US Letter with the fold exactly at the horizontal center, so a plain fold in half is always correct and no guide lines need to print. It uses fonts that ship with Word on both Windows and Mac, so nothing substitutes. And the text lives inside fixed text boxes sized to each panel, so typing a longer obituary cannot push the back cover out of place. If your text outgrows a box, the box tells you by clipping, and you shorten or resize deliberately instead of discovering the damage at the printer.",
      ],
    },
    {
      heading: "How to edit it without wrecking the layout",
      body: [
        "Work slowly and change only the text. The layout is already right, and almost every ruined template started with a well-meant adjustment to something structural.",
      ],
      list: {
        title: "The safe order of operations",
        items: [
          "Open the file and immediately save a copy under a new name, so you always have a clean original",
          "Click inside a placeholder and type over it. Do not drag the text boxes to new positions",
          "Replace the photo by right-clicking it and choosing Change Picture, which keeps its size and position, rather than deleting it and inserting a new one",
          "If your text is too long for its box, trim the text or reduce the font size by one point. Do not enlarge the box into a neighboring panel",
          "Leave the page margins and page size alone under Layout. They are what keeps the fold centered",
          "When finished, print one copy on plain paper and fold it before printing the rest",
        ],
      },
    },
    {
      heading: "Printing double-sided from Word",
      body: [
        "In Word, choose File, then Print. If your printer supports automatic two-sided printing, choose Print on Both Sides and then the option worded Flip pages on short edge. Short edge is the whole trick. The long-edge setting is Word's default and it prints the inside pages upside down relative to the cover.",
        "If your printer cannot print both sides on its own, print page 1 alone, put that sheet back in the paper tray, and print page 2 on the reverse. Every printer feeds paper differently, so run one plain-paper test to learn which way to reinsert the sheet before you commit your card stock.",
        "One more Word habit to check. In the print dialog, make sure scaling is set to 100 percent or Actual Size rather than any fit-to-paper option. Scaling moves the center line, and the center line is where the fold goes.",
      ],
    },
    {
      heading: "If Word is fighting you",
      body: [
        "Some weeks there is no patience left for software, and that is reasonable. Our free maker asks for the name, dates, order of service, and obituary in plain form fields and hands back a finished file. You can download it as a Word document and make small edits there, or skip Word entirely and take the PDF straight to a printer.",
      ],
    },
  ],
  faq: [
    {
      q: "Will this template open in Google Docs or older versions of Word?",
      a: "It opens in any Word from 2007 onward, and in the free Word web app. Google Docs will open it but tends to nudge text boxes a few points, so check the layout carefully if you go that route. If you do not have Word at all, the maker's PDF download avoids the problem entirely.",
    },
    {
      q: "The fonts look different on my computer. What happened?",
      a: "Word substitutes any font it cannot find, and substitution changes line lengths. This template only uses fonts bundled with Word, so this usually means the file was opened in a different program. Reopen it in Word itself, or select the affected text and set it back to the font named in the template notes.",
    },
    {
      q: "Can I add more pages for a longer obituary?",
      a: "A bifold is one sheet, so adding pages in Word creates a second sheet that will not fold into the first. If you need more room, either tighten the obituary to fit, or use the trifold version, which gives six panels instead of four on a single sheet.",
    },
  ],
  downloadNote: "US Letter · bifold · opens in Word",
  makerVariant: "word",
} as const;
