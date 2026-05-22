export function formationsFor(playersPerSide: number) {
  return playersPerSide === 7 ? ["2-2-2", "3-2-1", "2-3-1", "1-3-2", "2-1-3"] : ["2-2-1", "2-1-2", "1-2-2", "3-1-1"];
}

export function slotsForFormation(formation: string, topHalf: boolean) {
  const rows = formation.split("-").map(Number);
  const rowY = topHalf ? [76, 52, 28] : [24, 48, 72];
  const slots = [{ x: 50, y: topHalf ? 94 : 6, role: "GK" }];

  rows.forEach((count, rowIndex) => {
    Array.from({ length: count }).forEach((_, index) => {
      const x = ((index + 1) / (count + 1)) * 100;
      const role = rowIndex === 0 ? "DEF" : rowIndex === 1 ? "MID" : "ATT";
      slots.push({ x, y: rowY[rowIndex], role });
    });
  });

  return slots;
}
