import vehicles from "@/lib/bajajMaster/vehicle4w.json";
import rtoCities from "@/lib/bajajMaster/rtoCity.json";
import rtoLocationTable from "@/lib/sbiMasterData/rtoLocation.json";
import rtoDistrictTable from "@/lib/sbiMasterData/rtoDistrict.json";

// Matches RC data to Bajaj Allianz's own masters (from their WLS_REST_MOTOR
// kit): the vehicle code / make / model / subtype codes their premium API
// prices against, and the registration city + zone it expects.

export interface BajajVehicle {
  code: string;
  makeCode: string;
  make: string;
  modelCode: string;
  model: string;
  subtypeCode: string;
  subtype: string;
  cc: number | null;
  seats: number | null;
  fuel: string; // P / D / C (CNG) / B (battery) / PH (hybrid)
}

const norm = (s: any) => String(s || "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
const compact = (s: string) => s.replace(/\s+/g, "");

// RC fuel text -> Bajaj fuel code
function bajajFuel(rcFuel: any) {
  const f = norm(rcFuel);
  if (!f) return "";
  if (f.includes("CNG") || f.includes("LPG")) return "C";
  if (f.includes("HYBRID")) return "PH";
  if (f.includes("ELECTRIC") || f.includes("BATTERY")) return "B";
  if (f.includes("DIESEL")) return "D";
  if (f.includes("PETROL")) return "P";
  return "";
}

// RC / Zuno spellings that differ from Bajaj's master
const MAKE_ALIASES: Record<string, string> = {
  "MARUTI SUZUKI": "MARUTI",
  "TATA MOTORS": "TATA",
  MAHINDRA: "MAHINDRA AND MAHINDRA",
  VW: "VOLKSWAGEN",
  "MERCEDES BENZ": "MERCEDES-BENZ",
  KIA: "KIA MOTORS",
  MG: "MORRIS GARAGES",
  "MG MOTOR": "MORRIS GARAGES",
  NISSAN: "NISSAN MOTORS",
};

export type BajajVehicleMatch =
  | { ok: true; vehicle: BajajVehicle; ambiguous: boolean; candidates: number }
  | { ok: false; reason: string };

// rc: { vehicle_manufacturer_name, model, type (fuel), vehicle_cubic_capacity }
export function matchBajajVehicle(rc: any): BajajVehicleMatch {
  const rawMake = norm(rc.vehicle_manufacturer_name);
  const model = norm(rc.model);
  const fuel = bajajFuel(rc.type || rc.fuel);
  const cc = Number(rc.vehicle_cubic_capacity) || null;

  if (!rawMake || !model) return { ok: false, reason: "RC is missing make or model" };

  const all = vehicles as BajajVehicle[];
  const makes = [...new Set(all.map((v) => norm(v.make)))];

  // RC makers carry legal suffixes ("MARUTI SUZUKI INDIA LTD"): try the
  // alias table on every prefix, then the longest Bajaj make it starts with.
  let make = MAKE_ALIASES[rawMake] || rawMake;
  if (!makes.includes(norm(make))) {
    const words = rawMake.split(" ");
    for (let n = words.length; n > 0 && !makes.includes(norm(make)); n--) {
      const prefix = words.slice(0, n).join(" ");
      if (MAKE_ALIASES[prefix]) make = MAKE_ALIASES[prefix];
      else if (makes.includes(prefix)) make = prefix;
    }
  }
  const byMake = all.filter((v) => norm(v.make) === norm(make));
  if (!byMake.length) return { ok: false, reason: `No Bajaj vehicles for make "${rawMake}"` };

  // Exact model first; otherwise the longest Bajaj model name contained in
  // the RC model, so "GRAND i10" beats "i 10 1.2 KAPPA" for "GRAND I10 NIOS".
  const rcModel = compact(model);
  let byModel = byMake.filter((v) => compact(norm(v.model)) === rcModel);
  if (!byModel.length) {
    const contained = byMake.filter((v) => {
      const m = compact(norm(v.model));
      return m.length >= 3 && rcModel.includes(m);
    });
    const longest = Math.max(0, ...contained.map((v) => compact(norm(v.model)).length));
    byModel = contained.filter((v) => compact(norm(v.model)).length === longest);
  }
  if (!byModel.length) return { ok: false, reason: `No Bajaj model matches "${model}" for ${make}` };

  let pool = byModel;
  if (fuel) {
    const sameFuel = pool.filter((v) => v.fuel === fuel);
    if (sameFuel.length) pool = sameFuel;
  }
  if (cc) {
    const closest = Math.min(...pool.map((v) => Math.abs((v.cc || 0) - cc)));
    pool = pool.filter((v) => Math.abs((v.cc || 0) - cc) === closest);
  }

  // RC model text often names the trim ("NIOS ... SPORTZ"); prefer the
  // subtype whose words appear in it, then the most recent code.
  const overlap = (v: BajajVehicle) =>
    norm(v.subtype)
      .split(" ")
      .filter((w) => w.length >= 3 && rcModel.includes(w)).length;
  const bestOverlap = Math.max(0, ...pool.map(overlap));
  if (bestOverlap > 0) pool = pool.filter((v) => overlap(v) === bestOverlap);

  // Don't pick an automatic trim unless the RC says automatic.
  const isAuto = (s: string) => /\b(AMT|AT|CVT|DCT|AUTOMATIC)\b/.test(norm(s));
  const rcAuto = isAuto(model);
  const sameTransmission = pool.filter((v) => isAuto(v.subtype) === rcAuto);
  if (sameTransmission.length) pool = sameTransmission;

  // Remaining ties: fewest words the RC doesn't mention, then newest code.
  const extraWords = (v: BajajVehicle) =>
    norm(v.subtype).split(" ").filter((w) => w && !rcModel.includes(w)).length;
  const sorted = [...pool].sort(
    (a, b) => extraWords(a) - extraWords(b) || Number(b.code) - Number(a.code)
  );

  return {
    ok: true,
    vehicle: sorted[0],
    ambiguous: new Set(sorted.map((v) => v.subtype)).size > 1,
    candidates: sorted.length,
  };
}

// Bajaj spec: zone A for these registration cities, B for the rest
const ZONE_A_CITIES = [
  "AHMEDABAD", "BANGALORE", "CHENNAI", "HYDERABAD", "KOLKATA",
  "MUMBAI", "NEW DELHI", "PUNE", "DELHI",
];

const STATE_NAMES: Record<string, string> = {
  AN: "ANDAMAN AND NICOBAR ISLANDS", AP: "ANDHRA PRADESH", AR: "ARUNACHAL PRADESH",
  AS: "ASSAM", BR: "BIHAR", CG: "CHHATTISGARH", CH: "CHANDIGARH", DD: "DAMAN AND DIU",
  DL: "DELHI", DN: "DADRA AND NAGAR HAVELI", GA: "GOA", GJ: "GUJARAT", HP: "HIMACHAL PRADESH",
  HR: "HARYANA", JH: "JHARKHAND", JK: "JAMMU AND KASHMIR", KA: "KARNATAKA", KL: "KERALA",
  LA: "LADAKH", LD: "LAKSHADWEEP", MH: "MAHARASHTRA", ML: "MEGHALAYA", MN: "MANIPUR",
  MP: "MADHYA PRADESH", MZ: "MIZORAM", NL: "NAGALAND", OD: "ORISSA", OR: "ORISSA",
  PB: "PUNJAB", PY: "PONDICHERRY", RJ: "RAJASTHAN", SK: "SIKKIM", TN: "TAMIL NADU",
  TR: "TRIPURA", TS: "TELANGANA", UK: "UTTARAKHAND", UP: "UTTAR PRADESH", WB: "WEST BENGAL",
};

export type BajajRtoMatch =
  | { ok: true; city: string; zone: "A" | "B" }
  | { ok: false; reason: string };

// RTO code (e.g. "MH02") -> Bajaj registration city. The RC only gives the
// RTO code, so we go through SBI's RTO master (RTO -> district / location
// name) and pick the Bajaj city in the same state that best matches.
export function matchBajajRto(rtoCode: string): BajajRtoMatch {
  const code = String(rtoCode || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const state = code.slice(0, 2);
  // Delhi-style codes carry a series letter ("DL3C") — SBI's table keys on "DL-03"
  const rtoNumber = (code.slice(2).match(/^\d+/) || [""])[0];
  const formatted = `${state}-${rtoNumber.padStart(2, "0")}`;

  const stateName = STATE_NAMES[state];
  if (!stateName) return { ok: false, reason: `Unknown RTO state "${state}"` };

  const cityRows = (rtoCities as { state: string; city: string }[]).filter((r) => {
    const s = norm(r.state);
    return s === stateName || s.includes(stateName) || stateName.includes(s);
  });
  const cities = [...new Set(cityRows.map((r) => r.city))];
  if (!cities.length) return { ok: false, reason: `No Bajaj cities for state ${stateName}` };

  const loc = (rtoLocationTable as any[]).filter((r) => r.RTO_Code === formatted);
  const districtNames = loc
    .map((l) => (rtoDistrictTable as any[]).find((d) => d.District_Code === l.District_Code)?.District_Name)
    .filter(Boolean);
  const hints = [...districtNames, ...loc.map((l) => l.Location_Name)].map((h) => compact(norm(h)));

  // Score: exact name > Bajaj city contained in hint > hint contained in city
  let best: string | null = null;
  let bestScore = 0;
  for (const city of cities) {
    const c = compact(norm(city));
    for (const h of hints) {
      const score = c === h ? 1000 : h.includes(c) ? c.length * 2 : c.includes(h) ? h.length : 0;
      if (score > bestScore) {
        bestScore = score;
        best = city;
      }
    }
  }
  if (!best) return { ok: false, reason: `No Bajaj registration city for RTO ${formatted}` };

  // Exact name only — "NAVI MUMBAI" is zone B. Delhi's districts all count as Delhi.
  const isZoneA = ZONE_A_CITIES.includes(norm(best)) || state === "DL";
  return { ok: true, city: best, zone: isZoneA ? "A" : "B" };
}
