/** Google Analytics 4 with Consent Mode v2, denied by default.
 *
 * Inert unless `VITE_GA_MEASUREMENT_ID` is set at build time, so local dev and
 * forks send nothing. Every storage signal starts denied: until someone accepts
 * the banner, Google only receives cookieless pings. The choice is remembered
 * in localStorage. */

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
const CHOICE_KEY = "footbolski.analytics-consent";

export type AnalyticsChoice = "granted" | "denied";

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

let started = false;

// Must be the `arguments` object, not an array: gtag.js ignores plain arrays.
function gtag(..._args: unknown[]) {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

export const analyticsEnabled = Boolean(MEASUREMENT_ID);

export function getAnalyticsChoice(): AnalyticsChoice | null {
  try {
    const value = localStorage.getItem(CHOICE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

function applyConsent(mode: "default" | "update", choice: AnalyticsChoice) {
  gtag("consent", mode, {
    analytics_storage: choice,
    // Footbolski runs no ads, so these never turn on.
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    ...(mode === "default" ? { wait_for_update: 500 } : {})
  });
}

/** Loads gtag.js once, with consent denied unless the person already accepted. */
export function startAnalytics() {
  if (!MEASUREMENT_ID || started) return;
  started = true;

  window.dataLayer = window.dataLayer || [];
  applyConsent("default", "denied");
  const stored = getAnalyticsChoice();
  if (stored === "granted") applyConsent("update", "granted");

  gtag("js", new Date());
  // Page views are sent by hand (trackPageView) because this is a SPA and the
  // raw URL can carry a private invite or ballot token.
  gtag("config", MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
  document.head.appendChild(script);
}

export function setAnalyticsChoice(choice: AnalyticsChoice) {
  try {
    localStorage.setItem(CHOICE_KEY, choice);
  } catch {
    // Storage blocked: the choice still applies for this visit.
  }
  if (started) applyConsent("update", choice);
}

/** `/invite/:token` and `/motm/:token` are single-use links; their tokens must
 * never reach a third party. */
function scrubPath(pathname: string) {
  return pathname.replace(/^\/(invite|motm)\/[^/]+/, "/$1/:token");
}

export function trackPageView(pathname: string) {
  if (!MEASUREMENT_ID || !started) return;
  const path = scrubPath(pathname);
  gtag("event", "page_view", {
    page_path: path,
    page_location: `${window.location.origin}${path}`,
    page_title: document.title
  });
}
