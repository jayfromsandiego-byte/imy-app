// components/Analytics.tsx — privacy-friendly, cookieless analytics.
// Renders nothing unless NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set, so the app ships
// with zero tracking by default. No cookies, no personal data, no cross-site
// profiles — a tribute is not a product funnel. We only ever want to know,
// in aggregate, that pages load. Plausible (or any compatible cookieless script)
// can be enabled per-environment by setting the env vars below.
import Script from "next/script";

export default function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;
  const src = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.js";
  return <Script defer data-domain={domain} src={src} strategy="afterInteractive" />;
}
