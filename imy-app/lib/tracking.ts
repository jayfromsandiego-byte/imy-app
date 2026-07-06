// lib/tracking.ts — the consent-first tracking layer.
//
// Everything here is env-driven and silent by default: with no IDs configured,
// pages ship exactly zero tracking bytes and no banner. With IDs present, pages
// get Google Consent Mode v2 with every signal denied until the visitor agrees,
// a quiet in-brand consent card (the one approved visual addition), and a small
// event vocabulary: letter_started, letter_sealed, begin_checkout,
// trial_started, purchase — pushed to the dataLayer (GTM), to gtag directly
// when GTM is absent, and mapped to Meta standard events when the pixel is on.
//
// IDs (set in Vercel, Preview + Production — all optional):
//   NEXT_PUBLIC_GTM_ID         GTM-XXXXXXX  · preferred: manage every tag inside GTM
//   NEXT_PUBLIC_GA4_ID         G-XXXXXXXX   · direct fallback when GTM is absent
//   NEXT_PUBLIC_GOOGLE_ADS_ID  AW-XXXXXXXX  · direct fallback when GTM is absent
//   NEXT_PUBLIC_META_PIXEL_ID  159...       · loads only after the visitor consents
//
// The Meta pixel never loads before consent. Google tags load in cookieless
// "denied" consent mode and upgrade only on consent. Global Privacy Control is
// honored as a quiet no.

const env = (k: string) => (process.env[k] || "").trim();

export function trackingIds() {
  return {
    gtm: env("NEXT_PUBLIC_GTM_ID"),
    ga4: env("NEXT_PUBLIC_GA4_ID"),
    ads: env("NEXT_PUBLIC_GOOGLE_ADS_ID"),
    pixel: env("NEXT_PUBLIC_META_PIXEL_ID"),
  };
}

export function trackingConfigured(): boolean {
  const t = trackingIds();
  return Boolean(t.gtm || t.ga4 || t.ads || t.pixel);
}

const j = (s: string) => JSON.stringify(s);

/** Consent Mode v2 defaults + Google loaders. Place as early in <head> as possible. */
export function trackingHeadHtml(): string {
  if (!trackingConfigured()) return "";
  const t = trackingIds();
  const parts: string[] = [];
  parts.push(
    '<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}' +
      'gtag("consent","default",{ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",analytics_storage:"denied",wait_for_update:500});' +
      'gtag("set","ads_data_redaction",true);gtag("set","url_passthrough",true);</script>'
  );
  if (t.gtm) {
    parts.push(
      '<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({"gtm.start":new Date().getTime(),event:"gtm.js"});' +
        'var f=d.getElementsByTagName(s)[0],js=d.createElement(s),dl=l!="dataLayer"?"&l="+l:"";js.async=true;' +
        'js.src="https://www.googletagmanager.com/gtm.js?id="+i+dl;f.parentNode.insertBefore(js,f);})' +
        `(window,document,"script","dataLayer",${j(t.gtm)});</script>`
    );
  } else if (t.ga4 || t.ads) {
    const first = t.ga4 || t.ads;
    parts.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(first)}"></script>`);
    const cfg: string[] = ['gtag("js",new Date());'];
    if (t.ga4) cfg.push(`gtag("config",${j(t.ga4)});`);
    if (t.ads) cfg.push(`gtag("config",${j(t.ads)});`);
    parts.push(`<script>${cfg.join("")}</script>`);
  }
  return parts.join("\n");
}

/** Consent card + event plumbing. Place before </body>. */
export function trackingBodyHtml(): string {
  if (!trackingConfigured()) return "";
  const t = trackingIds();

  const css =
    "#imy-consent{position:fixed;right:18px;bottom:18px;z-index:9990;max-width:340px;background:#FAF5EC;color:#2C2520;" +
    "border:1px solid rgba(44,37,32,.14);border-radius:12px;padding:16px 18px;box-shadow:0 12px 34px rgba(26,19,13,.14);" +
    "font-family:'Besley',Georgia,serif;font-size:13.5px;line-height:1.55;animation:imyConsentIn .35s ease both}" +
    "#imy-consent p{margin:0 0 12px}" +
    "#imy-consent .row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}" +
    "#imy-consent .yes{background:#A87C5F;color:#fff;border:0;border-radius:22px;padding:8px 16px;font:inherit;font-weight:600;cursor:pointer}" +
    "#imy-consent .yes:hover{background:#96704F}" +
    "#imy-consent .no{background:none;border:0;color:rgba(44,37,32,.66);font:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:3px;padding:8px 2px}" +
    "#imy-consent a{color:rgba(44,37,32,.5);font-size:12px;margin-left:auto;text-decoration:underline;text-underline-offset:3px}" +
    "@keyframes imyConsentIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}" +
    "@media (prefers-reduced-motion:reduce){#imy-consent{animation:none}}" +
    "@media (max-width:480px){#imy-consent{left:12px;right:12px;bottom:12px;max-width:none}}";

  const cfg = `{gtm:${t.gtm ? "true" : "false"},ga4:${j(t.ga4)},ads:${j(t.ads)},pixel:${j(t.pixel)}}`;

  const script =
    "(function(){" +
    `var CFG=${cfg};var KEY="imy_consent";` +
    'function store(v){try{localStorage.setItem(KEY,v)}catch(e){}}' +
    'function choice(){try{return localStorage.getItem(KEY)||""}catch(e){return""}}' +
    "function pixel(){if(!CFG.pixel||window.fbq)return;" +
    '!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};' +
    'if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;' +
    's=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");' +
    'fbq("init",CFG.pixel);fbq("track","PageView");}' +
    'function grant(){try{window.gtag&&gtag("consent","update",{ad_storage:"granted",ad_user_data:"granted",ad_personalization:"granted",analytics_storage:"granted"})}catch(e){}' +
    'pixel();try{window.dataLayer&&dataLayer.push({event:"imy_consent_granted"})}catch(e){}}' +
    "window.imyTrack=function(n,p){p=p||{};" +
    "try{if(window.dataLayer)dataLayer.push(Object.assign({event:n},p))}catch(e){}" +
    "try{if(!CFG.gtm&&window.gtag)gtag(\"event\",n,p)}catch(e){}" +
    "try{if(window.fbq){" +
    'if(n==="purchase")fbq("track","Purchase",{value:p.value||0,currency:"USD"});' +
    'else if(n==="trial_started")fbq("track","StartTrial",{value:p.value||0,currency:"USD"});' +
    'else if(n==="begin_checkout")fbq("track","InitiateCheckout");' +
    'else if(n==="letter_sealed")fbq("track","CompleteRegistration");' +
    'else fbq("trackCustom",n,p)}}catch(e){}};' +
    "var gpc=false;try{gpc=!!navigator.globalPrivacyControl}catch(e){}" +
    "var c=choice();" +
    'if(c==="granted"){grant()}' +
    'else if(!c&&gpc){store("essential")}' +
    "else if(!c){" +
    'var el=document.createElement("div");el.id="imy-consent";el.setAttribute("role","dialog");' +
    'el.setAttribute("aria-label","Privacy choices");el.setAttribute("data-nosnippet","");' +
    "el.innerHTML='<p>A few quiet cookies help us understand how families find us. Nothing is shared until you say so.</p>" +
    '<div class="row"><button type="button" class="yes">That&#39;s alright</button>' +
    '<button type="button" class="no">Only what&#39;s needed</button>' +
    '<a href="/privacy">Privacy</a></div>\';' +
    "document.body.appendChild(el);" +
    'el.querySelector(".yes").addEventListener("click",function(){store("granted");grant();el.remove()});' +
    'el.querySelector(".no").addEventListener("click",function(){store("essential");el.remove()});' +
    "}" +
    'if(location.pathname==="/onboarding"){try{imyTrack("letter_started")}catch(e){}}' +
    "try{var of=window.fetch;window.fetch=function(){var u=arguments[0];var url=String((u&&u.url)||u||\"\");var pr=of.apply(this,arguments);" +
    'try{if(url.indexOf("/api/intake")>-1){pr.then(function(r){if(r&&r.ok)imyTrack("letter_sealed")},function(){})}' +
    'if(url.indexOf("/api/stripe/checkout")>-1){imyTrack("begin_checkout")}}catch(e){}return pr}}catch(e){}' +
    "try{var q=new URLSearchParams(location.search);" +
    'if(q.get("upgraded")==="1"){var cs=q.get("cs")||"";var plan=q.get("plan")||"";var seen="";' +
    'try{seen=localStorage.getItem("imy_cs_seen")||""}catch(e){}' +
    "if(!cs||seen.indexOf(cs)<0){" +
    'if(plan==="plus_monthly"){imyTrack("trial_started",{value:12,currency:"USD",plan:plan,transaction_id:cs})}' +
    'else{imyTrack("purchase",{value:97,currency:"USD",plan:plan||"plus",transaction_id:cs})}' +
    'if(cs){try{localStorage.setItem("imy_cs_seen",(seen+","+cs).slice(-400))}catch(e){}}' +
    "}}}catch(e){}" +
    "})();";

  return `<style>${css}</style>\n<script>${script}</script>`;
}

/** Server-side injection for the raw-HTML pages (landing, onboarding, tributes). */
export function injectTracking(html: string): string {
  if (!trackingConfigured()) return html;
  const head = trackingHeadHtml();
  const body = trackingBodyHtml();
  let out = html;
  const hi = out.lastIndexOf("</head>");
  if (hi >= 0 && head) out = out.slice(0, hi) + head + "\n" + out.slice(hi);
  const bi = out.lastIndexOf("</body>");
  if (bi >= 0 && body) out = out.slice(0, bi) + body + "\n" + out.slice(bi);
  return out;
}
