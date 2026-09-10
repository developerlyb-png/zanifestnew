"use client";

import React, { useState } from "react";
import styles from "@/styles/components/superadminsidebar/AgentPolicyReview.module.css";
import {
  FiArrowLeft,
  FiX,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiFileText,
  FiInbox,
} from "react-icons/fi";
import type { Policy } from "./PolicyDashboard";
import {
  TRANSACTION_TYPES,
  LINES_OF_BUSINESS,
  PRODUCTS_BY_LOB,
  POLICY_TYPES_BY_LOB,
  POLICY_REMARKS,
} from "@/constants/policyFormOptions";

const formatInr = (n?: number | null) =>
  n == null ? "-" : "₹" + Math.round(n).toLocaleString("en-IN");

const formatDisplayDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
    : "--";

const toDateInputValue = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : "");

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const value = status || "Pending";
  if (value === "Approved") {
    return (
      <span className={`${styles.statusBadge} ${styles.statusApproved}`}>
        <FiCheckCircle size={12} /> Approved
      </span>
    );
  }
  if (value === "Rejected") {
    return (
      <span className={`${styles.statusBadge} ${styles.statusRejected}`}>
        <FiXCircle size={12} /> Rejected
      </span>
    );
  }
  return (
    <span className={`${styles.statusBadge} ${styles.statusPending}`}>
      <FiClock size={12} /> Pending
    </span>
  );
};

const viewDocument = (dataUri: string) => {
  try {
    const [header, base64] = dataUri.split(",");
    const mime = header.match(/data:(.*);base64/)?.[1] || "application/pdf";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
    window.open(blobUrl, "_blank");
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } catch (err) {
    console.error("Failed to open document", err);
    window.open(dataUri, "_blank");
  }
};

interface EditableFields {
  policyNumber: string;
  insurer: string;
  lineOfBusiness: string;
  product: string;
  policyTypeStructure: string;
  transactionType: string;
  premium: string;
  grossPremium: string;
  commissionAmount: string;
  payoutAmount: string;
  subInsured: string;
  policyRemark: string;
  startDate: string;
  endDate: string;
  customerFullName: string;
  customerEmail: string;
  customerMobile: string;
  customerAddress: string;
}

function toEditableFields(p: Policy): EditableFields {
  return {
    policyNumber: p.policyNumber || "",
    insurer: p.insurer || "",
    lineOfBusiness: p.lineOfBusiness || p.policyType || "",
    product: p.product || "",
    policyTypeStructure: p.policyTypeStructure || "",
    transactionType: p.transactionType || "",
    premium: p.premium != null ? String(p.premium) : "",
    grossPremium: p.grossPremium != null ? String(p.grossPremium) : "",
    commissionAmount: p.commissionAmount != null ? String(p.commissionAmount) : "",
    payoutAmount: p.payoutAmount != null ? String(p.payoutAmount) : "",
    subInsured: p.subInsured || "",
    policyRemark: p.policyRemark || "",
    startDate: toDateInputValue(p.startDate),
    endDate: toDateInputValue(p.endDate),
    customerFullName: p.customer?.fullName || "",
    customerEmail: p.customer?.email || "",
    customerMobile: p.customer?.mobile || "",
    customerAddress: p.customer?.address || "",
  };
}

function PolicyReviewModal({
  policy,
  onClose,
  onSaved,
}: {
  policy: Policy;
  onClose: () => void;
  onSaved: (updated: Policy) => void;
}) {
  const [fields, setFields] = useState<EditableFields>(() => toEditableFields(policy));
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState<"save" | "approve" | "reject" | null>(null);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState<Policy>(policy);

  const setField = <K extends keyof EditableFields>(key: K, value: EditableFields[K]) =>
    setFields((f) => ({ ...f, [key]: value }));

  const productOptions = PRODUCTS_BY_LOB[fields.lineOfBusiness] || [];
  const policyTypeOptions = POLICY_TYPES_BY_LOB[fields.lineOfBusiness] || [];

  const submit = async (action?: "approve" | "reject") => {
    setError("");
    setSaving(action || "save");
    try {
      const res = await fetch(`/api/admin/policies/${current._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fields: {
            policyNumber: fields.policyNumber,
            insurer: fields.insurer,
            lineOfBusiness: fields.lineOfBusiness,
            product: fields.product,
            policyTypeStructure: fields.policyTypeStructure,
            transactionType: fields.transactionType,
            premium: fields.premium,
            grossPremium: fields.grossPremium,
            commissionAmount: fields.commissionAmount,
            payoutAmount: fields.payoutAmount,
            subInsured: fields.subInsured,
            policyRemark: fields.policyRemark,
            startDate: fields.startDate,
            endDate: fields.endDate,
            customer: {
              fullName: fields.customerFullName,
              email: fields.customerEmail,
              mobile: fields.customerMobile,
              address: fields.customerAddress,
            },
          },
          ...(action ? { action, remark: remark.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Something went wrong");
        setSaving(null);
        return;
      }
      setCurrent(data.policy);
      onSaved(data.policy);
      if (action) {
        onClose();
      } else {
        setFields(toEditableFields(data.policy));
        setSaving(null);
      }
    } catch (err) {
      console.error("Policy review update failed", err);
      setError("Something went wrong");
      setSaving(null);
    }
  };

  const documents = current.policyDocuments || [];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>{current.policyNumber || "Policy"}</h2>
            <div className={styles.modalSubtitle}>
              Submitted by <strong>{current.createdBy || "Agent"}</strong>
              {current.createdByAgentId && (
                <span className={styles.agentIdTag}>ID: {current.createdByAgentId}</span>
              )}
            </div>
          </div>
          <div className={styles.modalHeaderRight}>
            <StatusBadge status={current.adminApprovalStatus} />
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <FiX size={22} />
            </button>
          </div>
        </div>

        {error && <p className={styles.errorBanner}>{error}</p>}

        {current.adminApprovalReviewedBy && (
          <div className={styles.reviewedNote}>
            Last reviewed by <strong>{current.adminApprovalReviewedBy}</strong>
            {current.adminApprovalReviewedAt &&
              ` on ${formatDisplayDate(current.adminApprovalReviewedAt)}`}
            {current.adminApprovalRemark && <> — "{current.adminApprovalRemark}"</>}
          </div>
        )}

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Insured Details</h3>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Insured Name</label>
              <input
                className={styles.input}
                value={fields.customerFullName}
                onChange={(e) => setField("customerFullName", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Mobile</label>
              <input
                className={styles.input}
                value={fields.customerMobile}
                onChange={(e) => setField("customerMobile", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Email</label>
              <input
                className={styles.input}
                value={fields.customerEmail}
                onChange={(e) => setField("customerEmail", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Sub Insured</label>
              <input
                className={styles.input}
                value={fields.subInsured}
                onChange={(e) => setField("subInsured", e.target.value)}
              />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.fieldLabel}>Address</label>
              <input
                className={styles.input}
                value={fields.customerAddress}
                onChange={(e) => setField("customerAddress", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Policy Details</h3>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Policy Number</label>
              <input
                className={styles.input}
                value={fields.policyNumber}
                onChange={(e) => setField("policyNumber", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Insurer</label>
              <input
                className={styles.input}
                value={fields.insurer}
                onChange={(e) => setField("insurer", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Line of Business</label>
              <select
                className={styles.select}
                value={fields.lineOfBusiness}
                onChange={(e) => {
                  setField("lineOfBusiness", e.target.value);
                  setField("product", "");
                  setField("policyTypeStructure", "");
                }}
              >
                <option value="">Select</option>
                {LINES_OF_BUSINESS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Product</label>
              <select
                className={styles.select}
                value={fields.product}
                onChange={(e) => setField("product", e.target.value)}
                disabled={!fields.lineOfBusiness}
              >
                <option value="">Select</option>
                {productOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Policy Type</label>
              <select
                className={styles.select}
                value={fields.policyTypeStructure}
                onChange={(e) => setField("policyTypeStructure", e.target.value)}
                disabled={!fields.lineOfBusiness}
              >
                <option value="">Select</option>
                {policyTypeOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Business Type</label>
              <select
                className={styles.select}
                value={fields.transactionType}
                onChange={(e) => setField("transactionType", e.target.value)}
              >
                <option value="">Select</option>
                {TRANSACTION_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Policy Remark</label>
              <select
                className={styles.select}
                value={fields.policyRemark}
                onChange={(e) => setField("policyRemark", e.target.value)}
              >
                <option value="">Select</option>
                {POLICY_REMARKS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Risk Start Date</label>
              <input
                type="date"
                className={styles.input}
                value={fields.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Risk End Date</label>
              <input
                type="date"
                className={styles.input}
                value={fields.endDate}
                onChange={(e) => setField("endDate", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Premium</h3>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Premium Amount</label>
              <input
                className={styles.input}
                type="number"
                value={fields.premium}
                onChange={(e) => setField("premium", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Gross Premium</label>
              <input
                className={styles.input}
                type="number"
                value={fields.grossPremium}
                onChange={(e) => setField("grossPremium", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Commission Amount</label>
              <input
                className={styles.input}
                type="number"
                value={fields.commissionAmount}
                onChange={(e) => setField("commissionAmount", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Payout Amount</label>
              <input
                className={styles.input}
                type="number"
                value={fields.payoutAmount}
                onChange={(e) => setField("payoutAmount", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Documents</h3>
          {documents.length === 0 ? (
            <p className={styles.noDocsText}>No documents uploaded yet.</p>
          ) : (
            <div className={styles.docList}>
              {documents.map((doc, i) => (
                <button
                  key={i}
                  type="button"
                  className={styles.docItem}
                  onClick={() => viewDocument(doc.data)}
                >
                  <FiFileText size={14} /> {doc.fileName || `Document ${i + 1}`}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Admin Remark</h3>
          <textarea
            className={styles.textarea}
            placeholder="Why are you approving or rejecting this policy? (optional)"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnOutline}`}
            onClick={() => submit()}
            disabled={saving !== null}
          >
            {saving === "save" ? "Saving..." : "Save Changes"}
          </button>
          <div className={styles.footerSpacer} />
          <button
            type="button"
            className={`${styles.btn} ${styles.btnReject}`}
            onClick={() => submit("reject")}
            disabled={saving !== null}
          >
            <FiXCircle size={15} /> {saving === "reject" ? "Rejecting..." : "Reject"}
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnApprove}`}
            onClick={() => submit("approve")}
            disabled={saving !== null}
          >
            <FiCheckCircle size={15} /> {saving === "approve" ? "Approving..." : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AgentPolicyReview({
  policies,
  loading,
  onBack,
  onUpdated,
}: {
  policies: Policy[];
  loading: boolean;
  onBack: () => void;
  onUpdated: (updated: Policy) => void;
}) {
  const [selected, setSelected] = useState<Policy | null>(null);

  return (
    <div className={styles.panel}>
      <button type="button" className={styles.backLink} onClick={onBack}>
        <FiArrowLeft /> Back to Customer Dashboard
      </button>

      <div className={styles.panelTitleRow}>
        <div>
          <h3 className={styles.panelTitle}>Agent Policies</h3>
          <p className={styles.panelHint}>
            Policies submitted by agents. Review, correct, and approve or reject them here — an
            approved policy moves into the Customer Dashboard and the agent's own list.
          </p>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Agent</th>
              <th>Policy No.</th>
              <th>Insured Name</th>
              <th>Line of Business</th>
              <th>Premium</th>
              <th>Submitted On</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className={styles.emptyState}>
                  Loading...
                </td>
              </tr>
            ) : policies.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyState}>
                  <FiInbox size={28} />
                  <span>No agent-submitted policies yet.</span>
                </td>
              </tr>
            ) : (
              policies.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className={styles.agentCell}>
                      <span className={styles.agentName}>{p.createdBy || "--"}</span>
                      {p.createdByAgentId && (
                        <span className={styles.agentId}>ID: {p.createdByAgentId}</span>
                      )}
                    </div>
                  </td>
                  <td>{p.policyNumber || "--"}</td>
                  <td>{p.customer?.fullName || "--"}</td>
                  <td>{p.lineOfBusiness || p.policyType || "--"}</td>
                  <td>{formatInr(p.premium)}</td>
                  <td>{formatDisplayDate(p.createdAt)}</td>
                  <td>
                    <StatusBadge status={p.adminApprovalStatus} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.viewBtn}
                      onClick={() => setSelected(p)}
                      title="View policy details"
                      aria-label="View policy details"
                    >
                      <FiEye size={15} /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <PolicyReviewModal
          policy={selected}
          onClose={() => setSelected(null)}
          onSaved={(updated) => {
            setSelected(updated);
            onUpdated(updated);
          }}
        />
      )}
    </div>
  );
}
