// ============ src/lib/sbiGcv/cvJourney.ts ============
// Client-side glue: turns what the Commercial Vehicle journey stored in
// localStorage (CommercialVehicle1 -> cvVehicle / cvRcDetails) into the
// input /api/sbi/gcv/* expects. Type-only imports, so none of the server-side
// master data gets bundled into the browser.
import type { GcvQuoteInput } from "./requestBuilder";

export const SBI_GCV_STORAGE_KEY = "sbiGcvQuote"; // quote picked on CV5
export const SBI_GCV_POLICY_KEY = "sbiGcvPolicy"; // issued policy (success page)

const readJson = (key: string) => {
  try {
    const v = localStorage.getItem(key);
    return v && v !== "undefined" ? JSON.parse(v) : null;
  } catch {
    return null;
  }
};

// SBI GCV only covers goods carriers — buses/passenger vehicles are PCV.
export function isGoodsCarrier(rc: any): boolean {
  const cls = String(rc?.vehicleClass || "").toUpperCase();
  if (!cls) return true; // manual selection: assume truck (the CV default)
  return !/(BUS|PASSENGER|OMNI|MAXI CAB|MOTOR CAB|TAXI)/.test(cls);
}

export function buildGcvInputFromCvStorage(): GcvQuoteInput | null {
  const vehicle = readJson("cvVehicle");
  if (!vehicle) return null;
  const rc = readJson("cvRcDetails") || {};

  const regNo = String(vehicle.vehicleNumber || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const isNewVehicle = !regNo || regNo === "BRANDNEW";

  return {
    make: vehicle.make || "",
    model: vehicle.model || "",
    variant: vehicle.varient || "",
    grossWeight: rc.grossWeight || (String(vehicle.varient || "").match(/GVW\s*(\d+)/i)?.[1] ?? ""),
    fuelType: rc.fuelType || "",
    seatingCapacity: rc.seatingCapacity || "",
    registrationNumber: isNewVehicle ? "NEW" : regNo,
    isNewVehicle,
    registrationDate: rc.registrationDate || (vehicle.yearOfPurchase ? `${vehicle.yearOfPurchase}-01-01` : ""),
    manufactureYear: vehicle.yearOfPurchase || undefined,
    rtoCode: vehicle.rtoDetails?.rtoLocationName || "",
    chassisNumber: rc.chassisNumber || "",
    engineNumber: rc.engineNumber || "",
    permitType: rc.permitType || "",
    previousPolicy:
      !isNewVehicle && rc.insuranceUpto
        ? {
            insurerName: rc.previousInsurer || "",
            policyNumber: rc.previousPolicyNumber || "",
            endDate: rc.insuranceUpto,
            claimMade: vehicle.claimInLastYearPolicy === "Y",
            // previousNcb unknown here -> no NCB claimed until the customer
            // states it on the checkout page.
          }
        : undefined,
  };
}
