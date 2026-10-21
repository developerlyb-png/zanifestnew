import vehicles from "@/lib/digitMaster/vehicle4w.json";

// Matches an RC record (from the RC lookup) to Go Digit's vehicle master code.
// Digit quotes need their own vehicleMaincode, so this is the bridge from
// the RC data we already have to the code Digit prices against.

export interface DigitVehicle {
  code: string;
  make: string;
  model: string;
  variant: string;
  body: string;
  seats: number | null;
  cc: number | null;
  fuel: string;
  exShowroom: number | null;
  status: string;
  mfg: string;
}

const norm = (s: any) => String(s || "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();

const FUEL_ALIASES: Record<string, string> = {
  PETROL: "PETROL",
  DIESEL: "DIESEL",
  CNG: "CNG",
  "PETROL CNG": "CNG",
  ELECTRIC: "ELECTRIC",
  "PETROL/CNG": "CNG",
};

const normFuel = (s: any) => FUEL_ALIASES[norm(s)] || norm(s);

// RC / Zuno spellings that differ from Digit's master
const MAKE_ALIASES: Record<string, string> = {
  "TATA MOTORS": "TATA",
  MAHINDRA: "MAHINDRA AND MAHINDRA",
  VW: "VOLKSWAGEN",
  "MERCEDES BENZ": "MERCEDES BENZ",
  "MG MOTOR": "MG CAR COMPANY LTD",
};

export type DigitMatch =
  | { ok: true; vehicle: DigitVehicle; ambiguous: boolean; candidates: number }
  | { ok: false; reason: string };

// rc: { vehicle_manufacturer_name, model, type (fuel), vehicle_cubic_capacity }
// exShowroomPrice (optional, e.g. Zuno's exShowroomPrice) breaks ties between
// variants that share make/model/fuel/cc by picking the closest ex-showroom.
export function matchDigitVehicle(rc: any, exShowroomPrice?: number): DigitMatch {
  const rawMake = norm(rc.vehicle_manufacturer_name);
  const make = MAKE_ALIASES[rawMake] || rawMake;
  const model = norm(rc.model);
  const fuel = normFuel(rc.type);
  const cc = Number(rc.vehicle_cubic_capacity) || null;

  if (!make || !model) return { ok: false, reason: "RC is missing make or model" };

  const allVehicles = vehicles as DigitVehicle[];
  let byMake = allVehicles.filter((v) => norm(v.make) === make);
  if (!byMake.length) {
    // RC makers carry legal suffixes ("HYUNDAI MOTOR INDIA LTD"); use the
    // longest Digit make that the RC make starts with.
    const prefixed = [...new Set(allVehicles.map((v) => norm(v.make)))].filter(
      (m) => m && make.startsWith(m + " ")
    );
    const best = prefixed.sort((a, b) => b.length - a.length)[0];
    if (best) byMake = allVehicles.filter((v) => norm(v.make) === best);
  }
  if (!byMake.length) return { ok: false, reason: `No Digit vehicles for make "${make}"` };

  // Model match ignores spaces ("GRANDI10NIOS" vs "GRAND I10 NIOS"). Exact
  // first; otherwise the longest Digit model name contained in the RC model
  // wins, so "GRAND I10 NIOS" beats "GRAND I10" for "GRANDI10NIOS1.2...".
  const compact = (s: string) => s.replace(/\s+/g, "");
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
  if (!byModel.length) return { ok: false, reason: `No Digit model matches "${model}" for ${make}` };

  let pool = byModel;
  if (fuel) {
    const sameFuel = pool.filter((v) => normFuel(v.fuel) === fuel);
    if (sameFuel.length) pool = sameFuel;
  }
  if (cc) {
    const closest = Math.min(...pool.map((v) => Math.abs((v.cc || 0) - cc)));
    pool = pool.filter((v) => Math.abs((v.cc || 0) - cc) === closest);
  }

  // Several variants can share make/model/fuel/cc (e.g. LDi vs VDi). Prefer
  // vehicles still in production, then the closest ex-showroom price if we
  // have one, otherwise the most recent code.
  const inProduction = pool.filter((v) => /under production/i.test(v.status));
  if (inProduction.length) pool = inProduction;

  // RC model text often names the trim ("KAPPA SPORTZ VTVT"); prefer the
  // variant whose words appear in it.
  const rcText = rcModel;
  const overlap = (v: DigitVehicle) =>
    norm(v.variant)
      .split(" ")
      .filter((w) => w.length >= 4 && rcText.includes(compact(w))).length;
  const bestOverlap = Math.max(0, ...pool.map(overlap));
  if (bestOverlap > 0) pool = pool.filter((v) => overlap(v) === bestOverlap);
  const sorted = [...pool].sort((a, b) => {
    if (exShowroomPrice) {
      const da = Math.abs((a.exShowroom || 0) - exShowroomPrice);
      const db = Math.abs((b.exShowroom || 0) - exShowroomPrice);
      if (da !== db) return da - db;
    }
    return b.code.localeCompare(a.code);
  });

  return {
    ok: true,
    vehicle: sorted[0],
    ambiguous: !exShowroomPrice && new Set(sorted.map((v) => v.variant)).size > 1,
    candidates: sorted.length,
  };
}
