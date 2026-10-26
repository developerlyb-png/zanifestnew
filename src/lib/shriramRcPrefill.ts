// ============ src/lib/shriramRcPrefill.ts ============
// Pre-fills the Shriram proposal form from the RC lookup (RechargeKit
// rcAdvanceVerify, kept as rc.raw by /api/vahan/4w/rc-check). Kept apart from
// shriram4w.ts so the cart page doesn't bundle the vehicle/pincode masters.
//
// RC shapes seen: insurance_details { insurer: "ICICI LOMBARD", policy_number,
// policy_expiry_date: "yyyy-mm-dd" }, owner_details { father_name,
// present_address: "<address>, <pincode>", ownership_type: "INDIVIDUAL", ... }.

import previousInsurers from "@/lib/shriramMaster/previousInsurer.json";

// Words that carry no identity — "ICICI LOMBARD" and "ICICI Lombard General
// Insurance Company Limited" must reduce to the same key.
const NOISE = new Set([
  "THE", "GENERAL", "INSURANCE", "ASSURANCE", "COMPANY", "CO", "LTD", "LIMITED", "INDIA", "OF",
]);
const key = (s: string) =>
  String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && !NOISE.has(w));

// RC short names that don't share a leading word with Shriram's master name
const ALIASES: Record<string, string> = {
  DIGIT: "Go Digit General Insurance Ltd",
  CHOLA: "Cholamandalam MS General Insurance Co Ltd",
};

// Maps an RC insurer name to the exact string in Shriram's previous-insurer
// master, or "" when nothing matches confidently.
export function matchShriramInsurer(rcInsurer: string): string {
  const target = key(rcInsurer);
  if (!target.length) return "";
  const names = previousInsurers as string[];

  // Longest run of leading words shared with the master name wins
  let best = "";
  let bestScore = 0;
  for (const name of names) {
    const k = key(name);
    let n = 0;
    while (n < target.length && n < k.length && target[n] === k[n]) n++;
    if (n > bestScore) {
      bestScore = n;
      best = name;
    }
  }
  if (bestScore > 0) return best;
  return ALIASES[target[0]] || "";
}

const isoAddYears = (iso: string, years: number, days = 0) => {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  const d = new Date(+m[1] + years, +m[2] - 1, +m[3] + days);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// Values to pre-fill; every one stays editable in the form.
export function shriramPrefillFromRc(rc: any, registrationDateIso?: string) {
  const raw = rc?.raw || {};
  const ins = raw.insurance_details || {};
  const owner = raw.owner_details || {};

  const insurer = matchShriramInsurer(ins.insurer);
  const policyNumber = String(ins.policy_number || "").trim();

  // "<street, area, city>, 201301" — drop the trailing pincode
  const address = String(owner.present_address || owner.permanent_address || "")
    .replace(/,?\s*\d{6}\s*$/, "")
    .trim();

  // A car under 3 years is on its bundled policy: the TP part runs 3 years
  // from registration under the same policy number and insurer.
  const tpFrom = registrationDateIso || "";
  const tpTo = tpFrom ? isoAddYears(tpFrom, 3, -1) : "";

  return {
    fatherName: String(owner.father_name || "").trim(),
    address,
    pincode: String(rc?.pincode || "").trim(),
    previousInsurer: insurer,
    previousPolicyNo: policyNumber,
    tpPolicyNo: policyNumber,
    tpInsurer: insurer,
    tpFrom,
    tpTo,
  };
}
