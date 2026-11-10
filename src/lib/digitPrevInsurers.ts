// Go Digit previous-insurer code list (kit: Masters/"Motor Prevoius insurer
// List.xlsx") — used on the Create Quote proposal to tell Digit which
// insurer the previous policy was with.
export const DIGIT_PREV_INSURERS: { code: string; name: string }[] = [
  { code: "058", name: "National Insurance Co. Ltd." },
  { code: "102", name: "Royal Sundaram General Insurance Co. Limited" },
  { code: "103", name: "Reliance General Insurance Co. Ltd." },
  { code: "106", name: "IFFCO Tokio General Insurance Co. Ltd." },
  { code: "108", name: "Tata AIG General Insurance Co. Ltd." },
  { code: "113", name: "Bajaj Allianz General Insurance Co. Ltd." },
  { code: "115", name: "ICICI Lombard General Insurance Co. Ltd." },
  { code: "123", name: "Cholamandalam MS General Insurance Co. Ltd." },
  { code: "125", name: "HDFC ERGO General Insurance Co. Ltd." },
  { code: "132", name: "Future Generali India Insurance Company Limited" },
  { code: "134", name: "Universal Sompo General Insurance Co. Ltd." },
  { code: "137", name: "Shriram General Insurance Company Limited" },
  { code: "139", name: "Bharti AXA General Insurance Company Limited" },
  { code: "141", name: "Raheja QBE General Insurance Company Limited" },
  { code: "144", name: "SBI General Insurance Company Limited" },
  { code: "149", name: "Magma HDI General Insurance Company Limited" },
  { code: "150", name: "Liberty Videocon General Insurance Company Limited" },
  { code: "152", name: "Kotak Mahindra General Insurance Company Limited" },
  { code: "155", name: "Navi General Insurance Limited" },
  { code: "158", name: "Go Digit General Insurance Limited" },
  { code: "159", name: "Acko General Insurance Limited" },
  { code: "161", name: "Zuno General Insurance Company Limited" },
  { code: "190", name: "The New India Assurance Co. Ltd." },
  { code: "545", name: "United India Insurance Co. Ltd." },
  { code: "556", name: "The Oriental Insurance Co. Ltd." },
  { code: "XXX", name: "DHFL General Insurance Limited" },
];

function normalize(name: string) {
  return name.toUpperCase().replace(/[^A-Z]/g, "");
}

// Best-effort match from an RC's free-text insurer name to Digit's code —
// same "beat it with the proposal form value if known" pattern as Bajaj's.
export function digitPrevInsurerCode(rcInsurerName?: string): string {
  if (!rcInsurerName) return "";
  const target = normalize(rcInsurerName);
  if (!target) return "";
  for (const i of DIGIT_PREV_INSURERS) {
    const candidate = normalize(i.name.split(" ").slice(0, 2).join(" "));
    if (target.includes(candidate) || candidate.includes(target.slice(0, 8))) return i.code;
  }
  // Common short names the RC/Vahan data tends to use
  const aliases: Record<string, string> = {
    NATIONAL: "058",
    ROYALSUNDARAM: "102",
    RELIANCE: "103",
    IFFCOTOKIO: "106",
    TATAAIG: "108",
    BAJAJALLIANZ: "113",
    ICICILOMBARD: "115",
    CHOLAMANDALAM: "123",
    CHOLAMS: "123",
    HDFCERGO: "125",
    FUTUREGENERALI: "132",
    UNIVERSALSOMPO: "134",
    SHRIRAM: "137",
    BHARTIAXA: "139",
    RAHEJAQBE: "141",
    SBIGENERAL: "144",
    MAGMAHDI: "149",
    LIBERTYVIDEOCON: "150",
    LIBERTYGENERAL: "150",
    KOTAKMAHINDRA: "152",
    NAVIGENERAL: "155",
    GODIGIT: "158",
    DIGIT: "158",
    ACKO: "159",
    ZUNO: "161",
    EDELWEISS: "161",
    NEWINDIA: "190",
    UNITEDINDIA: "545",
    ORIENTAL: "556",
  };
  for (const [alias, code] of Object.entries(aliases)) {
    if (target.includes(alias)) return code;
  }
  return "";
}
