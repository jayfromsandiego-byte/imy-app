import Analytics from "@/components/Analytics";

export const metadata = {
  title: "I Miss You Memorial",
  description: "A beautiful place for the people we love.",
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
