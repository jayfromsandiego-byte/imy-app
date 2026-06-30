import Analytics from "@/components/Analytics";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://imissyoumemorial.com";

export const metadata = {
  metadataBase: new URL(SITE),
  title: { default: "I Miss You Memorial", template: "%s · I Miss You Memorial" },
  description:
    "A beautiful place for the people we love — hold their photos, their stories, and the voice of everyone who loved them.",
  applicationName: "I Miss You Memorial",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "I Miss You Memorial",
    title: "I Miss You Memorial",
    description: "A beautiful place for the people we love.",
    url: SITE,
  },
  twitter: {
    card: "summary_large_image",
    title: "I Miss You Memorial",
    description: "A beautiful place for the people we love.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
