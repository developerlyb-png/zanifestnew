import InvoiceAuditLog from "@/models/InvoiceAuditLog";

export type InvoiceAuditEntityType = "Invoice" | "InvoiceClient" | "InvoiceItem";
export type InvoiceAuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "status_changed"
  | "payment_added"
  | "payment_removed"
  | "signed_pdf_uploaded"
  | "email_sent";

// Fire-and-forget by design — an audit-log write failing must never block
// (or fail) the actual mutation it's describing.
export async function logInvoiceAudit(entry: {
  entityType: InvoiceAuditEntityType;
  entityId: any;
  entityLabel: string;
  action: InvoiceAuditAction;
  summary: string;
  performedBy: string;
}): Promise<void> {
  try {
    await InvoiceAuditLog.create(entry);
  } catch (err) {
    console.log("INVOICE AUDIT LOG ERROR", err);
  }
}

const fmt = (v: any) => {
  if (v === undefined || v === null || v === "") return "—";
  return String(v);
};

/**
 * Builds a one-line "field: old → new" summary for an update, used by the
 * Invoice/InvoiceClient/InvoiceItem PUT handlers. Only fields that actually
 * changed are listed, so "Updated invoice INV001" (nothing tracked changed)
 * never happens silently — callers should skip logging when this returns "".
 */
export function diffSummary(
  before: Record<string, any>,
  after: Record<string, any>,
  fields: { key: string; label: string }[]
): string {
  const changes: string[] = [];
  for (const { key, label } of fields) {
    const from = before[key];
    const to = after[key];
    // Shallow-compare: good enough for the scalar/display fields this is
    // used on (status, amounts, names, addresses) — not deep objects.
    if (String(from ?? "") !== String(to ?? "")) {
      changes.push(`${label} ${fmt(from)} → ${fmt(to)}`);
    }
  }
  return changes.join("; ");
}
