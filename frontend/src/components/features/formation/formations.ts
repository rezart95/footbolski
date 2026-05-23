export function formationsFor(playersPerSide: number) {
  if (playersPerSide >= 7) return ["2-2-2", "3-2-1", "2-3-1"];
  if (playersPerSide === 6) return ["2-2-1", "3-1-1", "2-1-2"];
  return ["2-1-1", "1-2-1", "2-2"];
}

export function slotsForFormation(formation: string, topHalf: boolean) {
  const rows = formation.split("-").map(Number);
  const rowY = topHalf ? [24, 48, 72] : [76, 52, 28];
  const slots = [{ x: 50, y: topHalf ? 6 : 94, role: "GK" }];

  rows.forEach((count, rowIndex) => {
    Array.from({ length: count }).forEach((_, index) => {
      const x = ((index + 1) / (count + 1)) * 100;
      const role = rowIndex === 0 ? "DEF" : rowIndex === 1 ? "MID" : "ATT";
      slots.push({ x, y: rowY[rowIndex], role });
    });
  });

  return slots;
}
