// One place that decides whether a policy is Motor / Health / Life / Other.
//
// Policies reach IssuedPolicy with very different `policyType` values:
//   - manual Add Policy form, Excel bulk upload, AI PDF import:
//       policyType = lineOfBusiness = "Motor" | "Non Motor"  (product holds the detail)
//   - online flows: "Car Insurance", "Two Wheeler Insurance", "Package Policy",
//       "Health" (Zuno health), ...
// The old check `policyType.includes("motor")` matched "Non Motor" too, so every
// manually entered / imported health, fire, marine, etc. policy was counted as
// Motor and the Health/Other buckets stayed at 0. This checks "non motor"
// first and then looks at product/LOB text for the real category.

export type PolicyCategory = "Motor" | "Health" | "Life" | "Other";

interface CategorizablePolicy {
  policyType?: string | null;
  lineOfBusiness?: string | null;
  product?: string | null;
}

// Includes motor cover types the online insurer flows store as policyType
// ("Package Policy", "Bundled Insurance", comprehensive / TP / OD).
const MOTOR_RE = /\b(motor|car|bike|two[\s-]?wheeler|2w|3w|4w|pvt car|private car|vehicle|commercial vehicle|gcv|pcv|misc d|taxi|tractor|scooter|package policy|bundled insurance|comprehensive|third party|own damage|stand[\s-]?alone od)\b/i;
const HEALTH_RE = /\b(health|mediclaim|medical|hospital|critical illness|personal accident|top[\s-]?up|super top[\s-]?up|family floater|arogya)\b/i;
const LIFE_RE = /\b(life|term plan|term insurance|endowment|ulip)\b/i;
const NON_MOTOR_RE = /\bnon[\s-]?motor\b/i;
const HEALTH_PRODUCTS = new Set(["HEALTH", "GMC", "PA", "GPA"]);

export function policyCategory(p: CategorizablePolicy): PolicyCategory {
  const type = String(p.policyType || "");
  const lob = String(p.lineOfBusiness || "");
  const product = String(p.product || "");
  const detail = `${product} ${type} ${lob}`;

  // Non Motor products from PRODUCTS_BY_LOB (constants/policyFormOptions.ts)
  // that are health-segment covers: "Health", group mediclaim (GMC) and
  // personal accident (PA / GPA) — IRDAI reports PA under Health too.
  // Matched exactly so a short code like "PA" can't hit unrelated text.
  if (HEALTH_PRODUCTS.has(product.trim().toUpperCase())) return "Health";

  // Health / Life win whenever the product says so, whatever the LOB.
  if (HEALTH_RE.test(detail)) return "Health";
  if (LIFE_RE.test(detail)) return "Life";

  // Explicit Non Motor (manual/bulk/AI) with no health/life product -> Other.
  if (NON_MOTOR_RE.test(type) || NON_MOTOR_RE.test(lob)) return "Other";

  if (MOTOR_RE.test(detail)) return "Motor";
  return "Other";
}

/** A readable business-line label for charts: "Non Motor" is replaced by the actual product. */
export function businessLineLabel(p: CategorizablePolicy): string {
  const lob = String(p.lineOfBusiness || p.policyType || "").trim();
  if (NON_MOTOR_RE.test(lob) && p.product) return String(p.product).trim();
  return lob || String(p.product || "").trim() || "Unspecified";
}
