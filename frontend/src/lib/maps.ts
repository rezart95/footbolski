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

/**
 * The street part of an address for display — drops a leading facility-name
 * segment (e.g. "Centrum Sportu Parkowa, Parkowa 12a, 30-538 Kraków" →
 * "Parkowa 12a, 30-538 Kraków") so it doesn't repeat the venue title. A plain
 * "Street, City" address (2 segments) is returned unchanged. The full address
 * is still what should be passed to mapsUrl() for the most accurate pin.
 */
export function streetAddress(address: string): string {
  const parts = address.split(",").map((s) => s.trim());
  return parts.length >= 3 ? parts.slice(1).join(", ") : address;
}
