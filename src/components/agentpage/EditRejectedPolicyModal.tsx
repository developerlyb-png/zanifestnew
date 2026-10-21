"use client";

import React, { useState } from "react";
import styles from "@/styles/components/agentpage/EditRejectedPolicyModal.module.css";
import { FiX, FiUploadCloud } from "react-icons/fi";
import type { Policy } from "./AgentPolicyDashboard";
import {
  TRANSACTION_TYPES,
  LINES_OF_BUSINESS,
  PRODUCTS_BY_LOB,
  POLICY_TYPES_BY_LOB,
  POLICY_REMARKS,
} from "@/constants/policyFormOptions";

const toDateInputValue = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : "");

interface EditableFields {
  policyNumber: string;
  insurer: string;
  lineOfBusiness: string;
  product: string;
  policyTypeStructure: string;
  transactionType: string;
  premium: string;
  grossPremium: string;
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

export default function EditRejectedPolicyModal({
  policy,
  onClose,
  onResubmitted,
}: {
  policy: Policy;
  onClose: () => void;
  onResubmitted: (updated: Policy) => void;
}) {
  const [fields, setFields] = useState<EditableFields>(() => toEditableFields(policy));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = <K extends keyof EditableFields>(key: K, value: EditableFields[K]) =>
    setFields((f) => ({ ...f, [key]: value }));

  const productOptions = PRODUCTS_BY_LOB[fields.lineOfBusiness] || [];
  const policyTypeOptions = POLICY_TYPES_BY_LOB[fields.lineOfBusiness] || [];

  const handleResubmit = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/agent/policies/${policy._id}`, {
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
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Something went wrong");
        setSaving(false);
        return;
      }
      onResubmitted(data.policy);
    } catch (err) {
      console.error("Resubmit policy failed", err);
      setError("Something went wrong");
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Edit & Resubmit</h2>
            <p className={styles.modalSubtitle}>
              Fix what the admin flagged, then resubmit — this sends it back for review as a fresh
              Pending policy.
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <FiX size={22} />
          </button>
        </div>

        {policy.adminApprovalRemark && (
          <div className={styles.rejectionNote}>
            <strong>Why it was rejected:</strong> {policy.adminApprovalRemark}
          </div>
        )}

        {error && <p className={styles.errorBanner}>{error}</p>}

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
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnOutline}`}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleResubmit}
            disabled={saving}
          >
            <FiUploadCloud size={15} /> {saving ? "Resubmitting..." : "Save & Resubmit"}
          </button>
        </div>
      </div>
    </div>
  );
}
