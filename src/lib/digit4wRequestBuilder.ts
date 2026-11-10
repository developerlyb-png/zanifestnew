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

export interface DigitProposer {
  firstName: string;
  lastName: string;
  dob: string; // yyyy-mm-dd
  gender: "Male" | "Female";
  mobile: string;
  email: string;
  address1: string;
  city: string;
  state: string; // Digit numeric state code (kit: Masters/State Code Master)
  pincode: string;
  nomineeName: string;
  nomineeRelation: string; // Digit relation code, e.g. "BROTHER"
  previousInsurerCode?: string;
  previousPolicyNumber?: string;
}

// Builds the body for /api/digit/4w/create-quote (kit "create_quote.txt") —
// same contract.coverages/vehicle shape the quick quote already priced,
// plus the proposer (persons[]), nominee and a KYC stub (kit: "if this block
// is not passed, system will return quote number but KYC won't complete" —
// we send it incomplete on purpose and finish KYC on Digit's hosted page).
export function buildDigitCreateQuoteBody(quoteInput: any, proposer: DigitProposer) {
  const quickQuote = buildDigitQuickQuoteBody(quoteInput);
  if ("error" in quickQuote) return quickQuote;

  const prevInsurerCode = proposer.previousInsurerCode || "";
  const prevPolicyNo = proposer.previousPolicyNumber || "";

  return {
    body: {
      enquiryId: quickQuote.body.enquiryId,
      contract: {
        ...quickQuote.body.contract,
        coverages: {
          ...quickQuote.body.contract.coverages,
          personalAccident: { selection: true, insuredAmount: 500000, coverTerm: 1 },
          // Quick Quote's own reference curl uses a string here and Digit
          // tolerates it there, but Create Quote's official sample
          // (create_quote.txt) uses a real boolean — matching that exactly
          // for the stricter endpoint rather than assuming it's equally lenient.
          legalLiability: {
            ...quickQuote.body.contract.coverages.legalLiability,
            paidDriverLL: { selection: null, insuredCount: 0 },
          },
        },
      },
      vehicle: quickQuote.body.vehicle,
      previousInsurer: {
        ...quickQuote.body.previousInsurer,
        isPreviousInsurerKnown: !!prevInsurerCode,
        previousInsurerCode: prevInsurerCode,
        previousPolicyNumber: prevPolicyNo || null,
        // Same string-vs-boolean mismatch as paidDriverLL.selection above.
        isClaimInLastYear: quickQuote.body.previousInsurer.isClaimInLastYear === "true",
      },
      pospInfo: process.env.DIGIT_POSP_UNIQUE_NUMBER
        ? {
            isPOSP: true,
            pospName: process.env.DIGIT_POSP_NAME || "",
            pospUniqueNumber: process.env.DIGIT_POSP_UNIQUE_NUMBER,
            pospLocation: null,
            pospPanNumber: process.env.DIGIT_POSP_PAN || "",
            pospAadhaarNumber: null,
            pospContactNumber: process.env.DIGIT_POSP_CONTACT || "",
          }
        : { isPOSP: false },
      persons: [
        {
          personType: "INDIVIDUAL",
          addresses: [
            {
              addressType: "PRIMARY_RESIDENCE",
              flatNumber: null,
              streetNumber: null,
              street: proposer.address1.slice(0, 60),
              district: proposer.city.slice(0, 60),
              state: proposer.state,
              city: proposer.city.slice(0, 60),
              country: "IN",
              pincode: proposer.pincode,
            },
          ],
          communications: [
            { communicationType: "EMAIL", communicationId: proposer.email, isPrefferedCommunication: true },
            { communicationType: "MOBILE", communicationId: proposer.mobile, isPrefferedCommunication: false },
          ],
          identificationDocuments: [],
          firstName: proposer.firstName,
          middleName: null,
          lastName: proposer.lastName,
          dateOfBirth: proposer.dob,
          gender: proposer.gender === "Female" ? "FEMALE" : "MALE",
          isDriver: true,
          isPolicyHolder: true,
          isVehicleOwner: true,
          isInsuredPerson: true,
        },
      ],
      nominee: {
        firstName: proposer.nomineeName,
        middleName: null,
        lastName: null,
        dateOfBirth: null,
        relation: proposer.nomineeRelation.toUpperCase(),
        personType: "INDIVIDUAL",
      },
      dealer: { dealerName: "", city: "", deliveryDate: null },
      motorQuestions: { furtherAgreement: "", selfInspection: true, financer: "" },
      // Sent intentionally incomplete — the quote still gets created (kit's own
      // note), and the customer finishes real KYC on Digit's hosted KYC page.
      kyc: {
        isKYCDone: false,
        ckycReferenceDocId: "D25",
        ckycReferenceNumber: "",
        dateOfBirth: proposer.dob,
        photo: "",
      },
    },
    enquiryId: quickQuote.body.enquiryId,
  };
}
