export function normalizeMake(make: string) {
  return make
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/PRIVATE LIMITED/g, "")
    .replace(/PVT LTD/g, "")
    .replace(/PVT LIMITED/g, "")
    .replace(/LIMITED/g, "")
    .replace(/LTD/g, "")
    .replace(/\s+/g, " ")
    .trim();
}