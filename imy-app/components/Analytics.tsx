// components/Analytics.tsx — analytics + the consent-first ad-tracking layer
// for the React pages (dashboard, signin, privacy, terms). The raw-HTML pages
// (landing, onboarding, tributes) get the same layer via lib/tracking's
// server-side injection, so there is exactly one implementation of consent.
//
// Ships nothing by default:
//  - Plausible renders only when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set (cookieless).
//  - The Google/Meta stack renders only when a tracking ID is configured, opens
//    in Consent Mode v2 "denied", and upgrades only when the visitor agrees on
//    the quiet consent card. Global Privacy Control is honored as a quiet no.
import Script from "next/script";
import { trackingConfigured, trackingHeadHtml, trackingBodyHtml } from "@/lib/tracking";

export default function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const src = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.js";
  const stack = trackingConfigured() ? trackingHeadHtml() + "\n" + trackingBodyHtml() : "";
  return (
    <>
      {domain ? <Script defer data-domain={domain} src={src} strategy="afterInteractive" /> : null}
      {stack ? (
        <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: stack }} />
      ) : null}
    </>
  );
}
