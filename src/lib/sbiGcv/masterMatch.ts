// ============ src/lib/sbiGcv/masterMatch.ts ============
// Maps free-text vehicle/location data (from the RC lookup or the Zuno-driven
// CV journey) onto SBI's own GCV master IDs. SBI rates strictly by its own
// IDs (VehicleMake / VehicleModel / Variant / RTOLocationID), so nothing can
// be quoted until these resolve.
//
// Data: src/lib/sbiGcv/masterData/*.json, generated from the GCV kit's
// Master data/CMVGC01/*.xls (active variants only) + pin_code.csv.
//
// Variant matching leans on GVW — SBI's variant names are often just
// "1550 GVW" / "MAXI TRUCK", while the RC always carries the gross weight.

import makeTable from "./masterData/make.json";
import modelTable from "./masterData/model.json";
import variantTable from "./masterData/variant.json";
import rtoLocationTable from "./masterData/rtoLocation.json";
import rtoCodeMap from "./masterData/rtoCodeMap.json";
import pincodeTable from "./masterData/pincode.json";
import insurerTable from "./masterData/previousInsurer.json";

export interface GcvMake { id: string; name: string }
export interface GcvModel { id: string; name: string; makeId: string }
export interface GcvVariant {
  id: string;
  modelId: string;
  name: string;
  bodyStyle: string;
  wheels: number;
  carrying: number;
  seating: number;
  gvw: number;
  fuel: string;
}
export interface GcvRtoLocation {
  locId: string;
  name: string;
  districtCode: string;
  zone: string;
  cluster: string;
  state: string;
}

const makes = makeTable as GcvMake[];
const models = modelTable as GcvModel[];
const variants = variantTable as GcvVariant[];
const rtoLocations = rtoLocationTable as GcvRtoLocation[];
const rtoMap = rtoCodeMap as Record<string, string>;
const pincodes = pincodeTable as unknown as Record<string, [string, string, string]>;
const insurers = insurerTable as { id: string; name: string }[];

const squash = (s: any) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const STOP = new Set([
  "LTD", "LIMITED", "PVT", "PRIVATE", "CO", "COMPANY", "INDIA", "MOTORS", "MOTOR",
  "AUTO", "AUTOMOBILES", "AND", "THE", "OF", "I", "P", "L", "INDUSTRIES",
  "VEHICLES", "VEHICLE", "COMMERCIAL", "GVW", "BS", "BSIV", "BSVI", "BS4", "BS6",
]);
const tokens = (s: any): string[] =>
  String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t));

// RC maker strings that don't share a word with SBI's make name.
const MAKE_ALIASES: Record<string, string[]> = {
  TATA: ["15"],
  EICHER: ["5", "59", "81"],
  VECV: ["81", "59"],
  ASHOK: ["2"],
  LEYLAND: ["2"],
  MAHINDRA: ["7", "21"],
  BHARATBENZ: ["45"],
  DAIMLER: ["45", "67"],
  SML: ["101", "14"],
  ISUZU: ["101", "62"],
  MAZDA: ["14", "101"],
  PIAGGIO: ["11", "63", "66"],
  MARUTI: ["9"],
  SUZUKI: ["9"],
  FORCE: ["6"],
  BAJAJ: ["4", "17"],
  VOLVO: ["16"],
  SCANIA: ["42"],
  MAN: ["56", "8"],
  ATUL: ["3"],
};

const normFuel = (f: string) => {
  const u = String(f || "").toUpperCase();
  if (u.includes("CNG")) return "CNG";
  if (u.includes("LPG")) return "LPG";
  if (u.includes("DIESEL")) return "DIESEL";
  if (u.includes("PETROL")) return "PETROL";
  if (u.includes("BATTERY") || u.includes("ELECTRIC")) return "ELECTRIC";
  return u;
};

// ---------- Make ----------
export function matchMakes(makeText: string): GcvMake[] {
  const t = tokens(makeText);
  const ids = new Set<string>();
  for (const w of t) for (const id of MAKE_ALIASES[w] || []) ids.add(id);
  if (squash(makeText).includes("BHARATBENZ")) ids.add("45");

  let best = 0;
  const scored = makes.map((m) => {
    const mt = new Set(tokens(m.name));
    const score = t.filter((w) => mt.has(w)).length;
    if (score > best) best = score;
    return { m, score };
  });
  if (best > 0) scored.filter((s) => s.score === best).forEach((s) => ids.add(s.m.id));
  return makes.filter((m) => ids.has(m.id));
}

// ---------- Model + Variant ----------
export interface GcvVehicleQuery {
  make?: string;
  model?: string;
  variant?: string;
  gvw?: number | string;
  fuel?: string;
  seating?: number | string;
  // Explicit SBI ids (manual selection) bypass matching entirely.
  variantId?: string;
}

export interface GcvVehicleMatch {
  make: GcvMake;
  model: GcvModel;
  variant: GcvVariant;
  score: number;
  reasons: string[];
}

function modelScore(model: GcvModel, modelText: string): number {
  const qt = tokens(modelText);
  const mt = tokens(model.name);
  if (!qt.length || !mt.length) return 0;
  const qs = squash(modelText);
  const ms = squash(model.name);
  let score = 0;
  if (qs === ms) score += 50;
  else if (ms.length >= 3 && qs.includes(ms)) score += 20 + ms.length;
  const set = new Set(qt);
  score += mt.filter((w) => set.has(w)).length * 10;
  // Penalise model-name words the query doesn't mention ("SUPER ACE" vs "ACE").
  score -= mt.filter((w) => !set.has(w) && !qs.includes(w)).length * 4;
  return score;
}

function variantScore(v: GcvVariant, q: GcvVehicleQuery, reasons?: string[]): number {
  let score = 0;
  const gvw = Number(String(q.gvw ?? "").replace(/[^\d.]/g, "")) || 0;
  if (gvw > 0 && v.gvw > 0) {
    const diff = Math.abs(v.gvw - gvw) / gvw;
    if (diff === 0) { score += 100; reasons?.push(`GVW exact ${gvw}`); }
    else if (diff <= 0.03) score += 70;
    else if (diff <= 0.1) score += 35;
    else score -= Math.min(60, diff * 100);
  }
  if (q.fuel) {
    if (normFuel(v.fuel) === normFuel(q.fuel)) { score += 20; reasons?.push(`fuel ${v.fuel}`); }
    else score -= 15;
  }
  const seats = Number(q.seating) || 0;
  if (seats && v.seating === seats) score += 5;
  const vt = new Set(tokens(`${q.variant || ""} ${q.model || ""}`));
  score += tokens(v.name).filter((w) => vt.has(w)).length * 8;
  return score;
}

export function matchVehicle(q: GcvVehicleQuery): GcvVehicleMatch | null {
  if (q.variantId) {
    const variant = variants.find((v) => v.id === String(q.variantId));
    const model = variant && models.find((m) => m.id === variant.modelId);
    const make = model && makes.find((m) => m.id === model.makeId);
    return variant && model && make
      ? { make, model, variant, score: 999, reasons: ["explicit variantId"] }
      : null;
  }

  const candidateMakes = matchMakes(q.make || "");
  if (!candidateMakes.length) return null;
  const makeIds = new Set(candidateMakes.map((m) => m.id));
  const makeModels = models.filter((m) => makeIds.has(m.makeId));

  const scoredModels = makeModels
    .map((m) => ({ m, s: modelScore(m, `${q.model || ""}`) }))
    .sort((a, b) => b.s - a.s);
  const topModelScore = scoredModels[0]?.s ?? 0;
  // Keep every model that's close to the best one — SBI often lists the same
  // truck under several model names ("2214", "AL 2214", "Tusker 2214",
  // "407" vs "SFC 407"), so GVW + fuel get the final say between them.
  const shortlist =
    topModelScore > 0
      ? scoredModels.filter((x) => x.s > 0 && x.s >= topModelScore - 30)
      : scoredModels; // no name signal at all: let GVW/fuel decide

  let best: GcvVehicleMatch | null = null;
  for (const { m, s } of shortlist) {
    for (const v of variants) {
      if (v.modelId !== m.id) continue;
      const reasons: string[] = [];
      const total = s * 2 + variantScore(v, q, reasons);
      if (!best || total > best.score) {
        best = {
          make: candidateMakes.find((mk) => mk.id === m.makeId)!,
          model: m,
          variant: v,
          score: total,
          reasons: [`model "${m.name}" (${s})`, ...reasons],
        };
      }
    }
  }
  return best;
}

// ---------- Master lists (manual selection UI) ----------
export const listMakes = () => [...makes].sort((a, b) => a.name.localeCompare(b.name));
export const listModels = (makeId: string) =>
  models.filter((m) => m.makeId === String(makeId)).sort((a, b) => a.name.localeCompare(b.name));
export const listVariants = (modelId: string) =>
  variants.filter((v) => v.modelId === String(modelId));

// ---------- RTO ----------
// Accepts "MH-01", "MH01", "MH1" or a full reg number "MH01AB1234".
export function normalizeRtoCode(input: string): string | null {
  const m = String(input || "").toUpperCase().replace(/[^A-Z0-9]/g, "").match(/^([A-Z]{2})(\d{1,2})/);
  return m ? `${m[1]}-${m[2].padStart(2, "0")}` : null;
}

export function matchRto(rtoCodeOrRegNo: string, fallbackPlaceName?: string): GcvRtoLocation | null {
  const code = normalizeRtoCode(rtoCodeOrRegNo);
  if (code && rtoMap[code]) {
    const hit = rtoLocations.find((r) => r.locId === rtoMap[code]);
    if (hit) return hit;
  }
  // Fallback: same state, fuzzy on a place name (RC "registered at" / city).
  const state = code?.slice(0, 2);
  const place = squash(fallbackPlaceName);
  if (!state || !place) return null;
  const inState = rtoLocations.filter((r) => r.state === state || r.cluster.startsWith(state));
  return (
    inState.find((r) => squash(r.name) === place) ||
    inState.find((r) => {
      const n = squash(r.name);
      return n.length > 3 && (place.includes(n) || n.includes(place));
    }) ||
    null
  );
}

// ---------- Proposer address (pincode -> SBI state/city/district codes) ----------
export function lookupPincode(pincode: string) {
  const row = pincodes[String(pincode || "").trim()];
  return row ? { stateCode: row[0], cityCode: row[1], districtCode: row[2] } : null;
}

// ---------- Previous insurer (T_RH_INSURA_COMPAN) ----------
export function matchInsurer(name: string): { id: string; name: string } | null {
  const q = tokens(name).filter((w) => !["GENERAL", "INSURANCE"].includes(w));
  if (!q.length) return null;
  let best: { id: string; name: string } | null = null;
  let bestScore = 0;
  for (const ins of insurers) {
    const t = new Set(tokens(ins.name));
    const s = q.filter((w) => t.has(w)).length;
    if (s > bestScore) { bestScore = s; best = ins; }
  }
  return best;
}
