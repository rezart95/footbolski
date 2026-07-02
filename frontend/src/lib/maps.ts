/**
 * Build a maps link for an address that opens the right native app:
 * Apple Maps on iOS/iPadOS, Google Maps everywhere else (the universal
 * Google Maps URL opens the app when installed, otherwise the web).
 */
export function mapsUrl(query: string): string {
  const q = encodeURIComponent(query);
  const ua = navigator.userAgent;
  const isIos =
    /iphone|ipad|ipod/i.test(ua) ||
    (ua.includes("Macintosh") && "ontouchend" in document); // iPadOS reports as Mac
  return isIos
    ? `https://maps.apple.com/?q=${q}`
    : `https://www.google.com/maps/search/?api=1&query=${q}`;
}
