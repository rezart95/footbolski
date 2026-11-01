/** "28.50 zł", or "25 zł" when the amount is whole. */
export function formatPrice(price: number) {
  return `${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)} zł`;
}

/** Each player's share of a bill, rounded up to the next grosz. Mirrors the
 * server (`event_service.split_cost`), so the preview matches what is saved and
 * the group never collects less than the bill. */
export function splitCost(total: number, players: number) {
  return Math.ceil(Math.round(total * 100) / players) / 100;
}
