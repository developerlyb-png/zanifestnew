// ============ src/lib/zuno4w.ts ============
// RC → Zuno catalog chain for 4W: make → model → variant → RTO → IDV → quote input

export function normalizeCarMake(raw: string) {
  const b = (raw || "").toUpperCase().replace(/\s+/g, " ").trim();
  if (b.includes("MARUTI")) return "MARUTI SUZUKI";
  if (b.includes("HYUNDAI")) return "HYUNDAI";
  if (b.includes("TATA")) return "TATA";
  if (b.includes("MAHINDRA")) return "MAHINDRA";
  if (b.includes("HONDA")) return "HONDA";
  if (b.includes("TOYOTA")) return "TOYOTA";
  if (b.includes("KIA")) return "KIA";
  if (b.includes("VOLKSWAGEN")) return "VOLKSWAGEN";
  if (b.includes("SKODA")) return "SKODA";
  if (b.includes("RENAULT")) return "RENAULT";
  if (b.includes("NISSAN")) return "NISSAN";
  if (b.includes("MG")) return "MG";
  if (b.includes("CHEVROLET")) return "CHEVROLET";
  if (b.includes("FORD")) return "FORD";
  return b;
}

// squash: uppercase, remove all non-alphanumerics
const squash = (s: string) =>
  String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

// Match RC model against Zuno's catalog
export function matchModel(rcModel: string, catalog: { model: string }[]) {
  const rcSq = squash(rcModel);
  let hit = catalog.find((m) => squash(m.model) === rcSq);
  if (hit) return hit.model;
  const contained = catalog
    .filter((m) => rcSq.includes(squash(m.model)))
    .sort((a, b) => squash(b.model).length - squash(a.model).length);
  if (contained.length) return contained[0].model;
  hit = catalog.find((m) => squash(m.model).includes(rcSq));
  return hit ? hit.model : null;
}

// Match variant: MT/AMT-aware, fuel-aware, displacement-aware
export function matchVariant(
  rcModelOrVariant: string,
  variants: { variant: string }[],
  fuel?: string,
  cubicCapacity?: string | number
) {
  const rcSq = squash(rcModelOrVariant);
  const isAMT = /AMT/.test(rcSq);
  const fuelUp = String(fuel || "").toUpperCase();
  const rcIsCNG = fuelUp.includes("CNG") || /CNG/.test(rcSq);
  const rcIsDiesel = fuelUp.includes("DIESEL") || /CRDI|DIESEL/.test(rcSq);

  // Engine displacement: 1197cc -> "12", 998cc -> "10"
  const cc = Number(cubicCapacity || 0);
  const litreDigits =
    cc > 0 ? (Math.round(cc / 100) / 10).toFixed(1).replace(".", "") : null;

  const scored = variants
    .map((v) => {
      const vSq = squash(v.variant);
      let score = 0;
      if (rcSq.includes(vSq) || vSq.includes(rcSq)) {
        score = Math.min(vSq.length, rcSq.length);
      } else {
        const tokens = [
          "SPORTZ", "MAGNA", "ASTA", "ERA", "CORPORATE",
          "KAPPA", "CRDI", "VTVT", "TURBO",
        ];
        score =
          tokens.filter((t) => rcSq.includes(t) && vSq.includes(t)).length * 5;
      }

      // transmission penalty
      const vIsAMT = /AMT/.test(vSq);
      if (vIsAMT !== isAMT) score -= 10;

      // fuel penalty
      const vIsCNG = /CNG/.test(vSq);
      const vIsDiesel = /CRDI|DIESEL|U2/.test(vSq);
      if (vIsCNG !== rcIsCNG) score -= 25;
      if (vIsDiesel !== rcIsDiesel) score -= 25;

      // displacement: reward matching litre digits, penalize mismatched
      if (litreDigits) {
        if (vSq.includes(litreDigits)) {
          score += 10;
        } else if (/(?:^|[^0-9])(\d{2})(?:MT|AMT|KAPPA|TURBO|CRDI)/.test(vSq)) {
          score -= 25; // has a different engine-size marker
        }
      }

      return { v: v.variant, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.length && scored[0].score > 0 ? scored[0].v : null;
}

// Pick IDV band from registration date
export function pickIdv(idvAmount: any, registrationDateIso: string) {
  const years =
    (Date.now() - new Date(registrationDateIso).getTime()) /
    (365.25 * 24 * 3600 * 1000);
  if (years <= 0.5) return idvAmount.upto6Months;
  if (years <= 1) return idvAmount.upto1Year;
  if (years <= 2) return idvAmount.upto2Year;
  if (years <= 3) return idvAmount.upto3Year;
  if (years <= 4) return idvAmount.upto4Year;
  if (years <= 5) return idvAmount.upto5Year;
  if (years <= 6) return idvAmount.upto6Year;
  if (years <= 7) return idvAmount.upto7Year;
  if (years <= 8) return idvAmount.upto8Year;
  if (years <= 9) return idvAmount.upto9Year;
  return idvAmount.upto10Year;
}

// Candidate idvCity per registration state prefix
const STATE_IDVCITY_CANDIDATES: Record<string, string[]> = {
  MH: ["MUMBAI"],
  DL: ["DELHI NCR"],
  HR: ["DELHI NCR"],
  UP: ["DELHI NCR"],
  GJ: ["AHMEDABAD"],
  KA: ["BANGALORE"],
  TN: ["CHENNAI"],
  TS: ["HYDERABAD"],
  AP: ["HYDERABAD"],
  WB: ["KOLKATA"],
  RJ: ["JAIPUR"],
  PB: ["CHANDIGARH"],
  MP: ["INDORE"],
};

// dd-mm-yyyy → yyyy-mm-dd
export function rcDateToIso(d: string) {
  const m = String(d || "").match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
}

// Break-in-insurance status from the previous OD policy's expiry date:
// NBK = No Break (expiring today/future), SBK = Short Break (<=90 days lapsed),
// LBK = Long Break (>90 days lapsed, or expiry unknown)
export function computeBreakinStatus(previousPolicyExpiryDate: string | null) {
  if (!previousPolicyExpiryDate) return "LBK";
  const diffDays = Math.round(
    (Date.now() - new Date(previousPolicyExpiryDate).getTime()) / 86400000
  );
  if (diffDays <= 0) return "NBK";
  if (diffDays <= 90) return "SBK";
  return "LBK";
}

// ============ THE FULL CHAIN ============
export async function buildCarQuoteInput(rc: any) {
  const make = normalizeCarMake(rc.vehicle_manufacturer_name);

  // 1) MODEL
  const modelRes = await fetch(
    `/api/zuno/4w/model?make=${encodeURIComponent(make)}`
  );
  const modelList = await modelRes.json();
  if (!Array.isArray(modelList) || !modelList.length)
    return { error: "NO_MODELS", make };

  const model = matchModel(rc.model, modelList);
  if (!model) return { error: "NO_MODEL_MATCH", make, modelList };

  // 2) VARIANT (fuel + displacement aware)
  const varRes = await fetch(
    `/api/zuno/4w/variant?make=${encodeURIComponent(
      make
    )}&model=${encodeURIComponent(model)}`
  );
  const variantList = await varRes.json();
  if (!Array.isArray(variantList) || !variantList.length)
    return { error: "NO_VARIANTS", make, model };

  const variant = matchVariant(
    rc.model,
    variantList,
    rc.type,
    rc.vehicle_cubic_capacity
  );
  if (!variant) return { error: "NO_VARIANT_MATCH", make, model, variantList };

  // 3) RTO
  const regNo = String(rc.reg_no || "").toUpperCase();
  const statePrefix = regNo.slice(0, 2);
  const rtoCode = (rc.rto_code || regNo.slice(0, 4)).toUpperCase();
  const rtoLocationFormatted = `${rtoCode.slice(0, 2)}-${rtoCode.slice(2)}`;

  const candidates = STATE_IDVCITY_CANDIDATES[statePrefix] || ["MUMBAI"];
  let rto: any = null;
  let idvcity = candidates[0];

  for (const city of candidates) {
    const rtoRes = await fetch(
      `/api/sbi/2w/master/rto?idvCity=${encodeURIComponent(city)}`
    );
    const rtoList = await rtoRes.json();
    if (Array.isArray(rtoList)) {
      const found = rtoList.find(
        (r: any) => r.rtolocation === rtoLocationFormatted
      );
      if (found) {
        rto = found;
        idvcity = city;
        break;
      }
      if (!rto && rtoList[0]) {
        rto = rtoList[0];
        idvcity = city;
      }
    }
  }
  if (!rto) return { error: "NO_RTO", rtoLocationFormatted };

  // 4) IDV (lowercase idvcity param)
  const idvRes = await fetch(
    `/api/zuno/4w/idv?make=${encodeURIComponent(
      make
    )}&model=${encodeURIComponent(model)}&variant=${encodeURIComponent(
      variant
    )}&idvcity=${encodeURIComponent(idvcity)}`
  );
  const idvData = await idvRes.json();
  if (!idvData?.idvAmount)
    return { error: "NO_IDV", make, model, variant, idvcity };

  const registrationDate = rcDateToIso(rc.reg_date);
  const idv = pickIdv(idvData.idvAmount, registrationDate);

  // 5) Assembled quote input
  return {
    make,
    model,
    variant,
    idv: String(idv),
    idvcity,
    rtoStateCode: rto.statecode,
    rtoLocationName: rto.rtolocation,
    rtoCityOrDistrict: rto.rtocityordistrict,
    rtoZone: rto.statecode,
    carZone: rto.carzone,
    clusterZone: rto.clusterzone,
    registrationDate,
    fuelType: rc.type || idvData.fuelType || "Petrol",
    bodystyleDescription: (rc.body_type || "HATCHBACK").replace(/\s+/g, ""),
    isNew: false,
    policyTenure: "1",
    masterCode: idvData.masterCode,
    exShowroomPrice: idvData.exShowroomPrice,
    engineNumber: rc.engine,
    chassisNumber: rc.chassis,
    registrationNumber: rc.reg_no || "",   // for fullQuote
    rcRaw: rc,                              // full RC carried forward
  };
}

// Parse the quick-quote response for the plans page
export function parseQuoteResponse(resp: any) {
  const d = resp?.data || resp;
  const p = d?.premiumDetails || {};
  // contractDetails comes back as a single object when only "Own Damage Contract"
  // is sent, but as an array (one entry per contract) once an Addon Contract is
  // added — normalize both shapes before reading insuredObject off it.
  const rawContracts = d?.contractDetails;
  const contractList = Array.isArray(rawContracts)
    ? rawContracts
    : rawContracts
    ? [rawContracts]
    : [];
  const io = contractList.find((c: any) => c?.insuredObject)?.insuredObject || {};
  return {
    netPremium: p.netTotalPremium,
    gst: p.gst,
    grossPremium: p.grossTotalPremium,
    odPremium: p.totalODPremium,
    addonPremium: p.totalAddOnPremium,
    idv: io.systemIdv,
    makeModelMasterCode: io.makeModelMasterCode,
    raw: d,
  };
}

// Re-quote with a user-overridden IDV (e.g. from the Edit IDV slider),
// carrying forward whichever addons are currently applied so they aren't dropped
export async function requoteWithIdv(
  quoteInput: any,
  idv: number,
  addons: string[] = []
) {
  const res = await fetch("/api/zuno/4w/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...quoteInput, idv: String(idv), addons }),
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || "Failed to re-quote with the new IDV");
  }

  return parseQuoteResponse(data);
}

// Re-quote with a user-selected addon set (subCoverage names), keeping the current IDV
export async function requoteWithAddons(
  quoteInput: any,
  idv: number,
  addons: string[]
) {
  return requoteWithIdv(quoteInput, idv, addons);
}