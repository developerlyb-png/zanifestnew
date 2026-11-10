// Go Digit state codes (kit: Masters/"State Code Master (1).xlsx") — used
// for the proposer's residential address.state on Create Quote.
export const DIGIT_STATES: { code: string; name: string }[] = [
  { code: "1", name: "Jammu and Kashmir" },
  { code: "2", name: "Himachal Pradesh" },
  { code: "3", name: "Punjab" },
  { code: "4", name: "Chandigarh" },
  { code: "5", name: "Uttarakhand" },
  { code: "6", name: "Haryana" },
  { code: "7", name: "Delhi" },
  { code: "8", name: "Rajasthan" },
  { code: "9", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Daman and Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Pondicherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
];

function normalize(name: string) {
  return name.toUpperCase().replace(/[^A-Z]/g, "");
}

// Best-effort match from an RC's free-text state name to Digit's code.
export function digitStateCode(stateName?: string): string {
  if (!stateName) return "";
  const target = normalize(stateName);
  const hit = DIGIT_STATES.find((s) => normalize(s.name) === target);
  if (hit) return hit.code;
  const partial = DIGIT_STATES.find((s) => target.includes(normalize(s.name)) || normalize(s.name).includes(target));
  return partial?.code || "";
}
