// Builds Bajaj's quote input (the same shape the 4W flow sends to
// /api/bajaj/4w/quote) from what the bike flow keeps in localStorage:
//   bikeRcDetails     — RC lookup (bikeinsurance.tsx): brand, model, fuel,
//                       capacity, registrationDate, insurance {insurer,
//                       policyNumber, expiryDate}
//   selectedBikeData  — the picked bike (twowheeler.tsx): make/model/variant
//                       in Zuno's catalog names, year, isNewBike
// RC text matches Bajaj's own master better than Zuno's names, so it wins
// when present. No vehicle master here, so pages can import it.

const isoToDmy = (iso: string) => {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};

export function buildBajaj2wQuoteInput(bike: any, rc: any) {
  const isNew = bike?.isNewBike === true || bike?.isNewBike === "true";
  const regNo = String(rc?.registrationNumber || bike?.registrationNumber || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const regIso = String(rc?.registrationDate || "").slice(0, 10);
  const ins = rc?.insurance || {};

  const make = rc?.brand || bike?.make || "";
  const model = rc?.model || [bike?.model, bike?.variant].filter(Boolean).join(" ");
  const year = String(bike?.year || "").match(/\d{4}/)?.[0] || "";

  return {
    isNew,
    registrationNumber: isNew ? "NEW" : regNo,
    // Without an RC date only the year is known (manual flow)
    registrationDate: regIso || (year ? `${year}-01-01` : ""),
    previousPolicyExpiryDate: isNew ? "" : String(ins.expiryDate || "").slice(0, 10),
    // The bike flow doesn't ask about claims; anything but "No" means no NCB
    claimDeclaration: "",
    rcRaw: {
      vehicle_manufacturer_name: make,
      model,
      type: rc?.fuel || bike?.fuelType || "",
      vehicle_cubic_capacity: String(rc?.capacity || bike?.capacity || ""),
      reg_no: regNo,
      rto_code: regNo.slice(0, 4),
      reg_date: isoToDmy(regIso),
      vehicle_manufacturing_month_year: year ? `01/${year}` : "",
      // The builder reads the current policy from rc.raw.insurance_details
      raw: { insurance_details: { insurer: ins.insurer || "", policy_number: ins.policyNumber || "" } },
    },
  };
}
