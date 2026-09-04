// ============ src/lib/sbi4wMasterMatch.ts ============
// Matches RC-derived vehicle/location text against SBI's own official
// master-data tables (extracted from the SBIG_PMCAR01 Motor JSON Integration
// Kit's Master_datatables/*.xlsx into src/lib/sbiMasterData/*.json) —
// replacing the single-vehicle hardcoded lookups in sbi4wRequestBuilder.ts
// with real matching that works for any make/model/variant/RTO/city/district
// SBI has on file. Mirrors the normalize+score approach already proven in
// zuno4w.ts's matchModel/matchVariant.

import makeTable from "./sbiMasterData/make4w.json";
import modelTable from "./sbiMasterData/model4w.json";
import variantTable from "./sbiMasterData/variant4w.json";
import rtoLocationTable from "./sbiMasterData/rtoLocation.json";
import districtTable from "./sbiMasterData/district.json";
import cityTable from "./sbiMasterData/city.json";

const squash = (s: any) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

// Unlike squash(), keeps word boundaries — squash() would merge "KAPPA
// SPORTZ VTVT" into one unbroken blob, making token-set comparisons useless.
const tokenize = (s: any): string[] =>
  String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

// ---------- Vehicle Make ----------
export function matchMake(rcMake: string) {
  const target = squash(rcMake);
  if (!target) return null;
  const rows = makeTable as any[];

  let best: any = null;
  let bestScore = 0;
  for (const row of rows) {
    const name = squash(row.Make_Name);
    if (!name) continue;
    let score = 0;
    if (name === target) score = 1000;
    else if (target.includes(name)) score = name.length;
    else if (name.includes(target)) score = target.length * 0.9;
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }
  return best ? { makeId: String(best.Make_ID), row: best } : null;
}

// SBI's Model_4W splits the SAME model into separate rows per fuel type
// (e.g. "Grand I10 Nios - Petrol" vs "Grand I10 Nios - Diesel", different
// Model_IDs) — the base name alone is ambiguous, so this must be fuel-aware.
function modelFuelHint(nameSq: string): "PETROL" | "DIESEL" | "CNG" | null {
  if (nameSq.includes("DIESEL")) return "DIESEL";
  if (nameSq.includes("CNG")) return "CNG";
  if (nameSq.includes("PETROL")) return "PETROL";
  return null;
}

// ---------- Vehicle Model ----------
export function matchModel(makeId: string, rcModel: string, fuel?: string) {
  const target = squash(rcModel);
  if (!target) return null;
  const rows = (modelTable as any[]).filter((r) => String(r.Make_ID) === String(makeId));

  const fuelUp = String(fuel || "").toUpperCase();
  const rcFuelHint: "PETROL" | "DIESEL" | "CNG" | null = fuelUp.includes("DIESEL")
    ? "DIESEL"
    : fuelUp.includes("CNG")
    ? "CNG"
    : fuelUp.includes("PETROL")
    ? "PETROL"
    : null;

  let best: any = null;
  let bestScore = 0;
  for (const row of rows) {
    const name = squash(row.Model_Name);
    if (!name) continue;
    let score = 0;
    if (name === target) score = 1000;
    else if (target.includes(name)) score = name.length; // longest containment wins
    else if (name.includes(target)) score = target.length * 0.9;
    else continue;

    // Disambiguate models that differ only by a fuel-type suffix.
    const rowFuelHint = modelFuelHint(name);
    if (rowFuelHint && rcFuelHint) {
      score += rowFuelHint === rcFuelHint ? 50 : -50;
    } else if (rowFuelHint && !rcFuelHint) {
      score -= 5; // slight penalty for an unconfirmed fuel-specific row
    }

    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }
  return best
    ? {
        modelId: String(best.Model_ID),
        vehicleSegment: best.Vehicle_Segment,
        tacCode: String(best.TAC_Code),
        row: best,
      }
    : null;
}

// ---------- Vehicle Variant (fuel/transmission/displacement-aware, same
// scoring idea as zuno4w.ts's matchVariant) ----------
// NOTE: makeTacCode is the Make's TAC_Code (from matchMake's row.TAC_Code),
// NOT its Make_ID — Variant_4W's "Make_TAC" column is keyed by TAC_Code,
// a completely separate identifier from the Make_ID used in the actual
// VehicleMake request field (confirmed by inspecting the raw table: Hyundai
// is Make_ID 11 / TAC_Code 8, and its variants carry Make_TAC "8").
export function matchVariant(
  makeTacCode: string,
  modelId: string,
  rcVariantOrModelText: string,
  fuel?: string,
  cubicCapacity?: string | number
) {
  const rcSq = squash(rcVariantOrModelText);
  const rows = (variantTable as any[]).filter(
    (r) => String(r.Make_TAC) === String(makeTacCode) && String(r.Model_ID) === String(modelId)
  );
  if (!rows.length) return null;

  // squash() strips spaces, so word-boundary regexes can't distinguish
  // "MT" from "AMT" reliably after squashing — check the substrings directly.
  const isAMT = /AMT|CVT/.test(rcSq);
  const fuelUp = String(fuel || "").toUpperCase();
  const rcIsCNG = fuelUp.includes("CNG") || /CNG/.test(rcSq);
  const rcIsDiesel = fuelUp.includes("DIESEL") || /CRDI|DIESEL|DDIS|MULTIJET/.test(rcSq);
  const rcIsPetrol = fuelUp.includes("PETROL") && !rcIsCNG && !rcIsDiesel;

  const cc = Number(cubicCapacity || 0);

  const rcTokenSet = new Set(tokenize(rcVariantOrModelText));

  const scored = rows.map((row) => {
    const vSq = squash(row.Variant_Name);
    let score = 0;

    if (vSq === rcSq) {
      score += 1000;
    } else {
      // Jaccard similarity over tokens — rewards overlap AND penalizes both
      // missing tokens (RC asked for something the variant lacks) and extra
      // ones (e.g. a "Dual Tone"/DT variant when RC never mentioned it),
      // so near-duplicate trims don't tie on raw overlap count alone.
      const vTokenSet = new Set(tokenize(row.Variant_Name));
      const intersection = [...vTokenSet].filter((t) => rcTokenSet.has(t)).length;
      const union = new Set([...rcTokenSet, ...vTokenSet]).size;
      score += union > 0 ? (intersection / union) * 100 : 0;
      // Small bonus when one string literally contains the other, to still
      // favor that over a same-Jaccard-score token-shuffled alternative.
      if (rcSq.includes(vSq) || vSq.includes(rcSq)) score += 10;
    }

    // Fuel type: table's Fuel_Type is a code (1=Petrol,2=Diesel,3=CNG,...) —
    // see src/lib/sbiMasterData/ (loaded from SBI_T_FuelType).
    const rowFuel = String(row.Fuel_Type);
    if (rcIsCNG && rowFuel === "3") score += 25;
    else if (rcIsCNG && rowFuel !== "3") score -= 25;
    if (rcIsDiesel && rowFuel === "2") score += 25;
    else if (rcIsDiesel && rowFuel !== "2") score -= 25;
    if (rcIsPetrol && rowFuel === "1") score += 10;

    // Transmission
    const vIsAMT = /AMT|CVT/.test(vSq);
    if (vIsAMT === isAMT) score += 10;
    else score -= 10;

    // Displacement — reward an exact/near CC match
    const rowCC = Number(row.CC || 0);
    if (cc > 0 && rowCC > 0) {
      const diff = Math.abs(rowCC - cc);
      if (diff === 0) score += 15;
      else if (diff <= 50) score += 5;
      else if (diff > 300) score -= 15;
    }

    return { row, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];
  return top && top.score > 0
    ? { variantId: String(top.row.Variant_ID), row: top.row }
    : null;
}

// ---------- RTO location ----------
// RC's rto_code is unhyphenated (e.g. "UP14"); the master table's RTO_Code
// is hyphenated (e.g. "UP-14").
export function matchRtoLocation(rtoCode: string) {
  const raw = String(rtoCode || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const stateAbbrev = raw.slice(0, 2);
  const numberPart = raw.slice(2);
  const normalized = `${stateAbbrev}-${numberPart}`;

  const rows = rtoLocationTable as any[];
  const hit = rows.find((r) => String(r.RTO_Code).toUpperCase() === normalized);
  if (!hit) return null;

  return {
    locationId: String(hit.Location_ID),
    cityDistrict: String(hit.District_Code),
    cluster: String(hit.RTO_Cluster),
    region: String(hit.RTO_Region),
    zone: String(hit.RTO_Zone),
    stateId: String(hit.State_ID),
    row: hit,
  };
}

// ---------- District (customer address) ----------
export function matchDistrict(stateCode: string, districtName: string) {
  const target = squash(districtName);
  if (!target) return null;
  const rows = (districtTable as any[]).filter(
    (r) => String(r.State_Code).toUpperCase() === String(stateCode).toUpperCase()
  );

  let best: any = null;
  let bestScore = 0;
  for (const row of rows) {
    const name = squash(row.District_Name);
    if (!name) continue;
    let score = 0;
    if (name === target) score = 1000;
    else if (target.includes(name) || name.includes(target)) {
      score = Math.min(name.length, target.length);
    }
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }
  return best ? { districtCode: String(best.District_Code), row: best } : null;
}

// ---------- City (customer address) ----------
// Some rows use CCA_Code instead of City_Code (the two are mutually
// exclusive alternates — see sbi4wRequestBuilder.ts's earlier notes).
export function matchCity(stateCode: string, cityName: string) {
  const target = squash(cityName);
  if (!target) return null;
  const rows = (cityTable as any[]).filter(
    (r) => String(r.State_Code).toUpperCase() === String(stateCode).toUpperCase()
  );

  let best: any = null;
  let bestScore = 0;
  for (const row of rows) {
    const name = squash(row.City_Name);
    if (!name) continue;
    let score = 0;
    if (name === target) score = 1000;
    else if (target.includes(name) || name.includes(target)) {
      score = Math.min(name.length, target.length);
    }
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }
  if (!best) return null;
  const code = best.City_Code || best.CCA_Code;
  return code ? { cityCode: String(code), row: best } : null;
}
