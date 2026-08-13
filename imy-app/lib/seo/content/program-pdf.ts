export const content = {
  slug: "funeral-program/pdf",
  intro: "This is a free print-ready PDF funeral program. Print-ready means the margins, fold position, and page order are already correct, so you can send it to a home printer or a print shop and get back exactly what you saw on screen. This page explains what to check and what to ask for.",
  sections: [
    {
      heading: "What print-ready actually means",
      body: [
        "A print-ready PDF is a locked drawing of the finished page. Unlike a Word file, nothing reflows, no fonts substitute, and the file looks identical on every machine, which is why print shops prefer it.",
        "For a folded program, three measurements matter. The margins keep text safely away from the paper's edge, since most printers cannot print the outer eighth of an inch. The fold position sits exactly at the center of the sheet, so folding in half is always correct and no crease runs through a name or a face. And the page order is arranged so that when the sheet is printed on both sides and folded, the cover, inside pages, and back all land where they should.",
        "You may see the words bleed and fold marks at commercial printers. Bleed means the design runs slightly past the trim edge so color reaches the very edge of the paper, and fold marks are small ticks showing where to crease. Our PDFs keep the design inside the printable area instead, so no trimming is needed and no marks print. For a program run on Letter card stock, that is the simpler and cheaper path.",
      ],
    },
    {
      heading: "Printing at home versus a print shop",
      body: [
        "At home, you need a printer that can print both sides, either automatically or by refeeding the sheet, and a small stack of card stock. Look for 65 lb cover as a minimum. It is the weight of a greeting card, folds cleanly by hand, and most home printers accept it through the rear or bypass tray. 80 lb cover feels noticeably finer but jams some home printers, so test one sheet first.",
        "A print shop is worth it for larger services, for photo-heavy programs, or simply because it removes one task from the week. Office supply stores, local print shops, and grocery store print counters all handle this daily and can usually turn it around the same day.",
        "When you hand over the file, the whole order fits in one sentence. Ask for double-sided on the short edge, on 65 to 80 lb cover stock, at 100 percent scale, folded in half. If they offer scoring, say yes. A scored crease is a shallow pressed line that makes heavier stock fold sharply without cracking the ink.",
      ],
    },
    {
      heading: "Common PDF printing mistakes",
      body: [
        "Almost every ruined batch traces back to one of a few settings, and all of them are visible in the print dialog before any paper is wasted.",
      ],
      list: {
        title: "Check these before you print the stack",
        items: [
          "Fit to page shrinks the layout by a few percent and shifts the fold line off center. Set scaling to Actual Size or 100 percent",
          "Long-edge duplex flips the sheet the wrong way for a folded program, printing the inside upside down. Choose short-edge",
          "Printing from a browser preview instead of a real PDF reader, which sometimes adds its own margins. Download the file and open it in Adobe Reader or your system viewer",
          "Loading card stock without changing the printer's paper type setting, which can cause pale ink or jams. Set paper type to card stock or heavy",
          "Skipping the plain-paper test. Print one copy, fold it, and read it through before running the rest",
        ],
      },
    },
    {
      heading: "Getting a PDF made for you",
      body: [
        "Our free maker produces this PDF from a short form. You enter the name, dates, photo, order of service, and obituary, and it returns a finished file with everything positioned correctly. Nothing to design, nothing to align. Download it, run the one-sheet test, and print.",
      ],
    },
  ],
  faq: [
    {
      q: "Can I edit a PDF after downloading it?",
      a: "Not easily, and that is by design. A PDF is a fixed snapshot, which is what makes it reliable to print. If you expect to make changes, edit in the maker and download a fresh PDF, or use the Word version of the template and export your own PDF when the text is final.",
    },
    {
      q: "What card stock should I ask for at the print shop?",
      a: "Ask for 65 to 80 lb cover stock. 65 lb cover runs through nearly any machine and feels substantial. 80 lb cover feels finer still and is a good choice when the shop is doing the printing and scoring. In a shop's own vocabulary you can also simply say greeting card weight.",
    },
    {
      q: "The print shop asked if I want bleed. What do I say?",
      a: "Say the file is designed without bleed, to print at 100 percent on Letter with no trimming. Our layouts keep everything inside the printable area on purpose, so there is nothing to trim and no oversized paper to pay for.",
    },
  ],
  downloadNote: "US Letter · bifold · opens in Word",
  makerVariant: "pdf",
} as const;
