import type { Metadata } from "next";

// A utility door, not a destination — search engines have no business here.
export const metadata: Metadata = {
  title: "Sign in · I Miss You Memorial",
  description: "Return to the pages you keep.",
  robots: { index: false, follow: false },
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
