// Shared row-mapping logic for the Policies bulk-upload flow, used by both
// /api/admin/policies-bulk and /api/agent/policies-bulk so the two stay in
// sync (same accepted columns, same coercion rules).

export const REQUIRED_KEYS = ["policyNumber", "insurer", "lineOfBusiness", "premium"];

export const num = (v: any): number | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

export const str = (v: any): string | undefined => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
};

export const date = (v: any): Date | undefined => {
  const s = str(v);
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

export const rowIsBlank = (row: Record<string, any>) =>
  Object.values(row).every((v) => v === undefined || v === null || String(v).trim() === "");

export function mapRow(row: Record<string, any>, managersByName: Map<string, any>) {
  const lineOfBusiness = str(row.lineOfBusiness);
  const isMotor = lineOfBusiness === "Motor";
  const manager = str(row.reportingManagerName)
    ? managersByName.get(String(row.reportingManagerName).trim().toLowerCase())
    : undefined;

  const agentType = str(row.agentType)?.toLowerCase();
  const pospPartnerValue =
    agentType === "direct" ? str(row.directAgentName) : str(row.pospPartner);

  return {
    policyNumber: str(row.policyNumber),
    insurer: str(row.insurer),
    policyType: lineOfBusiness,
    lineOfBusiness,
    product: str(row.product),
    transactionType: str(row.transactionType),
    paymentReceivedDate: date(row.paymentReceivedDate),
    policyTypeStructure: str(row.policyTypeStructure),
    mediumOfIssuance: str(row.mediumOfIssuance),
    subInsured: str(row.subInsuredName),
    endorsementNo: "-",
    pospPartner: pospPartnerValue || "Direct Business",
    policyRemark: str(row.policyRemark) || "",
    status: str(row.status) || "Active",
    startDate: date(row.startDate),
    endDate: date(row.endDate),
    customer: {
      fullName: str(row.insuredName) || "",
      email: str(row.insuredEmail),
      mobile: str(row.insuredMobile),
      address: str(row.address),
    },
    vehicle: isMotor
      ? {
          number: str(row.registrationNumber),
          make: str(row.motorMake),
          model: str(row.product),
          vehicleType: str(row.vehicleType),
          fuelType: str(row.fuelType),
          modelYear: str(row.modelYear),
          itemsCovered: str(row.itemsCovered),
          ncbApplicable: str(row.ncbApplicable),
          caseType: str(row.caseType),
        }
      : undefined,
    assignment: {
      branchName: str(row.branchName),
      reportingManager: manager ? { id: manager._id, name: manager.name } : undefined,
      agentType,
      pospPartner: pospPartnerValue,
    },
    gstAmount: num(row.gstAmount),
    taxRate: num(row.taxRate),
    premium: num(row.premium),
    grossPremium: num(row.grossPremium),
    commissionAmount: num(row.commissionAmount) ?? null,
    payoutAmount: num(row.payoutAmount) ?? null,
    payoutStatus: str(row.payoutStatus) || "PENDING",
    rewardStatus: str(row.rewardStatus),
    commissionRemark: str(row.commissionRemark),
    source: "manual",
  };
}
