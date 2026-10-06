import { matchDigitVehicle } from "@/lib/digitVehicleMatch";
import { rcDateToIso } from "@/lib/zuno4w";

// Builds the body for /api/digit/4w/quickquote from the same quote input the
// Zuno and SBI flows already use, so all three insurers price the same
// vehicle, IDV, and previous-policy details.
export function buildDigitQuickQuoteBody(quoteInput: any) {
  const rc = quoteInput.rcRaw || {};
  const match = matchDigitVehicle(rc, Number(quoteInput.exShowroomPrice) || undefined);
  if (!match.ok) return { error: match.reason };

  const pincode = String(quoteInput.pincode || "").trim();
  if (!/^\d{6}$/.test(pincode)) return { error: "Pincode is required for Digit quote" };

  const regIso = rcDateToIso(rc.reg_date);
  const today = new Date();
  const start = today.toISOString().slice(0, 10);
  const endDate = new Date(today);
  endDate.setFullYear(endDate.getFullYear() + 1);
  endDate.setDate(endDate.getDate() - 1);

  const prevExpiry = quoteInput.previousPolicyExpiryDate || "";

  return {
    body: {
      enquiryId: `zanifest-${Date.now()}`,
      contract: {
        insuranceProductCode: "20101",
        subInsuranceProductCode: 31,
        startDate: start,
        endDate: endDate.toISOString().slice(0, 10),
        policyHolderType: "INDIVIDUAL",
        externalPolicyNumber: null,
        isNCBTransfer: null,
        coverages: {
          voluntaryDeductible: "ZERO",
          thirdPartyLiability: { isTPPD: false },
          ownDamage: {
            discount: { userSpecialDiscountPercent: 0, discounts: [] },
            surcharge: { loadings: [] },
          },
          personalAccident: { selection: true, insuredAmount: 500000, coverTerm: null },
          accessories: {
            cng: { selection: false, insuredAmount: 0 },
            electrical: { selection: false, insuredAmount: 0 },
            nonElectrical: { selection: false, insuredAmount: 0 },
          },
          addons: {
            partsDepreciation: { claimsCovered: null, selection: false },
            roadSideAssistance: { selection: true },
            personalBelonging: { selection: false },
            keyAndLockProtect: { selection: false },
            engineProtection: { selection: false },
            tyreProtection: { selection: false },
            rimProtection: { selection: false },
            returnToInvoice: { selection: false },
            consumables: { selection: false },
            evShield: {
              planC: { selection: false },
              noCopayEV: { selection: false },
              evClaims2: { selection: false },
              selection: false,
            },
          },
          legalLiability: {
            paidDriverLL: { selection: "false", insuredCount: 0 },
            employeesLL: { selection: false, insuredCount: 4 },
            unnamedPaxLL: { selection: false, insuredCount: null },
            cleanersLL: { selection: false, insuredCount: null },
            nonFarePaxLL: { selection: false, insuredCount: null },
            workersCompensationLL: { selection: false, insuredCount: null },
          },
          unnamedPA: {
            unnamedPax: { selection: false, insuredAmount: 0, insuredCount: null },
            unnamedPaidDriver: { selection: false, insuredAmount: 0, insuredCount: null },
            unnamedHirer: { selection: false, insuredAmount: null, insuredCount: null },
            unnamedPillionRider: { selection: false, insuredAmount: null, insuredCount: null },
            unnamedCleaner: { selection: false, insuredAmount: null, insuredCount: null },
            unnamedConductor: { selection: false, insuredAmount: null, insuredCount: null },
          },
        },
      },
      vehicle: {
        isVehicleNew: false,
        vehicleMaincode: match.vehicle.code,
        licensePlateNumber: String(rc.reg_no || quoteInput.registrationNumber || "").toUpperCase(),
        vehicleIdentificationNumber: String(rc.chassis || ""),
        registrationAuthority: String(rc.rto_code || "").toUpperCase().slice(0, 4),
        engineNumber: String(rc.engine || ""),
        manufactureDate: regIso,
        registrationDate: regIso,
        vehicleIDV: { idv: Math.round(Number(quoteInput.idv) || 0) },
        usageType: null,
        permitType: null,
        motorType: null,
      },
      previousInsurer: {
        isPreviousInsurerKnown: false,
        previousInsurerCode: "",
        previousPolicyNumber: null,
        previousPolicyExpiryDate: prevExpiry || null,
        isClaimInLastYear: quoteInput.claimDeclaration === "Yes" ? "true" : "false",
        originalPreviousPolicyType: "1OD_1TP",
        previousPolicyType: null,
        previousNoClaimBonus: "ZERO",
        currentThirdPartyPolicy: null,
      },
      pospInfo: { isPOSP: "false" },
      pincode,
    },
    matchedCode: match.vehicle.code,
    matchedModel: `${match.vehicle.make} ${match.vehicle.model} ${match.vehicle.variant}`,
    ambiguous: match.ambiguous,
  };
}
