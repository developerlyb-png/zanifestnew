// Bajaj previous-insurer codes, kept apart from the request builder so the
// cart page can use them without bundling Bajaj's vehicle master.

// Kit: "Prev Insurance Company Codes"
const PREV_INSURER_CODES: [RegExp, string][] = [
  [/NEW INDIA/, "1"],
  [/TATA AIG/, "2"],
  [/UNITED INDIA/, "3"],
  [/NATIONAL INS/, "4"],
  [/ORIENTAL/, "5"],
  [/BAJAJ/, "6"],
  [/ICICI/, "8"],
  [/IFFCO/, "9"],
  [/RELIANCE/, "10"],
  [/ROYAL SUNDARAM/, "11"],
  [/HDFC/, "12"],
  [/CHOLA/, "13"],
  [/FUTURE GENERALI/, "17"],
  [/UNIVERSAL SOMPO/, "18"],
  [/SHRIRAM/, "20"],
  [/BHARTI AXA/, "21"],
  [/RAHEJA|NAVI GENERAL/, "22"],
  [/SBI/, "24"],
  [/L ?& ?T/, "25"],
  [/LIBERTY/, "29"],
  [/MAGMA/, "30"],
  [/KOTAK|ZURICH KOTAK/, "31"],
  [/DHFL/, "32"],
  [/ACKO/, "33"],
  [/DIGIT/, "34"],
  [/EDELWEISS|ZUNO/, "43"],
];

export function bajajPrevInsurerCode(name: string) {
  const n = String(name || "").toUpperCase();
  return PREV_INSURER_CODES.find(([re]) => re.test(n))?.[1] || null;
}

// Kit "Prev Insurance Company Codes", for the proposal form's dropdown.
// Bajaj (6) is left out: its own renewals are a different policy type.
export const BAJAJ_PREV_INSURERS: { code: string; name: string }[] = [
  { code: "1", name: "The New India Assurance Company Limited" },
  { code: "2", name: "Tata AIG General Insurance Company Limited" },
  { code: "3", name: "United India Insurance Company Limited" },
  { code: "4", name: "National Insurance Company Limited" },
  { code: "5", name: "The Oriental Insurance Company Limited" },
  { code: "8", name: "ICICI Lombard General Insurance Company Limited" },
  { code: "9", name: "IFFCO Tokio General Insurance Company Limited" },
  { code: "10", name: "Reliance General Insurance Company Limited" },
  { code: "11", name: "Royal Sundaram General Insurance Co. Limited" },
  { code: "12", name: "HDFC ERGO General Insurance Company Limited" },
  { code: "13", name: "Cholamandalam MS General Insurance Company Limited" },
  { code: "17", name: "Future Generali India Insurance Company Limited" },
  { code: "18", name: "Universal Sompo General Insurance Company Limited" },
  { code: "20", name: "Shriram General Insurance Company Limited" },
  { code: "21", name: "Bharti AXA General Insurance Company Limited" },
  { code: "22", name: "Raheja QBE General Insurance Company Limited" },
  { code: "24", name: "SBI General Insurance Company Limited" },
  { code: "25", name: "L&T General Insurance Company Limited" },
  { code: "29", name: "Liberty General Insurance Limited" },
  { code: "30", name: "Magma HDI General Insurance Company Limited" },
  { code: "31", name: "Kotak Mahindra General Insurance" },
  { code: "32", name: "DHFL General Insurance Limited" },
  { code: "33", name: "Acko General Insurance Limited" },
  { code: "34", name: "Go Digit General Insurance Limited" },
  { code: "43", name: "Edelweiss (Zuno) General Insurance Company Limited" },
];
