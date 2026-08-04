"use client";

import React, { useEffect, useState } from "react";
import styles from "@/styles/components/superadminsidebar/PolicyDetailView.module.css";
import {
  FiArrowLeft, FiEdit2, FiTrash2, FiChevronUp, FiChevronDown, FiUser, FiFileText,
  FiDollarSign, FiEye, FiDownload, FiCalendar, FiTruck, FiPercent,
} from "react-icons/fi";

interface PolicyDetailViewProps {
  policyId: string;
  onBack: () => void;
  onDeleted: () => void;
}

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

const formatDate = (d?: string | null) => {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  const month = date.toLocaleDateString("en-US", { month: "long" });
  return `${month} ${ordinal(date.getDate())} ${date.getFullYear()}`;
};

const formatInr = (n?: number | null) =>
  n == null ? "—" : `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const dashIfEmpty = (v?: string | number | null) =>
  v === undefined || v === null || v === "" ? "—" : v;

interface FieldProps {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ icon, label, value }) => (
  <div className={styles.field}>
    <span className={styles.fieldIcon}>{icon}</span>
    <div>
      <div className={styles.fieldLabel}>{label}</div>
      <div className={styles.fieldValue}>{value}</div>
    </div>
  </div>
);

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ icon, title, subtitle, defaultOpen, children }) => {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className={styles.card}>
      <button type="button" className={styles.sectionHeader} onClick={() => setOpen((o) => !o)}>
        <span className={styles.sectionIcon}>{icon}</span>
        <span className={styles.sectionHeaderText}>
          <span className={styles.sectionTitle}>{title}</span>
          <span className={styles.sectionSubtitle}>{subtitle}</span>
        </span>
        {open ? <FiChevronUp /> : <FiChevronDown />}
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  );
};

const downloadFile = (data: string, fileName: string) => {
  const a = document.createElement("a");
  a.href = data;
  a.download = fileName || "document";
  a.click();
};

const viewFile = (data: string) => {
  window.open(data, "_blank");
};

const PolicyDetailView: React.FC<PolicyDetailViewProps> = ({ policyId, onBack, onDeleted }) => {
  const [policy, setPolicy] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/policies/${policyId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPolicy(d.policy);
        else setError(d.message || "Failed to load policy");
      })
      .catch(() => setError("Failed to load policy"))
      .finally(() => setLoading(false));
  }, [policyId]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this policy? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/policies/${policyId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        onDeleted();
      } else {
        alert(data.message || "Failed to delete policy");
      }
    } catch {
      alert("Failed to delete policy");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loading}>Loading policy details...</div>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className={styles.wrapper}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          <FiArrowLeft /> Back to Policies
        </button>
        <div className={styles.errorBanner}>{error || "Policy not found"}</div>
      </div>
    );
  }

  const isMotor = (policy.lineOfBusiness || policy.policyType) === "Motor" && policy.vehicle;
  const documents: { data: string; fileName: string }[] = [
    ...(policy.policyDocuments || []),
    ...(policy.paymentDetails?.transactionProof?.data
      ? [{ ...policy.paymentDetails.transactionProof, fileName: policy.paymentDetails.transactionProof.fileName || "Transaction Proof" }]
      : []),
  ];

  const premiumRows = policy.premiumBreakdown || [];
  const totals = premiumRows.reduce(
    (acc: any, r: any) => ({
      sumInsured: acc.sumInsured + (r.sumInsured || 0),
      premiumAmount: acc.premiumAmount + (r.premiumAmount || 0),
      commissionAmount: acc.commissionAmount + (r.commissionAmount || 0),
    }),
    { sumInsured: 0, premiumAmount: 0, commissionAmount: 0 }
  );
  totals.commissionAmount += policy.rewardAmount || 0;

  return (
    <div className={styles.wrapper}>
      <button type="button" className={styles.backBtn} onClick={onBack}>
        <FiArrowLeft /> Back to Policies
      </button>

      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <span className={styles.headerAvatar}>
            <FiUser size={22} />
          </span>
          <div>
            <div className={styles.headerPolicyNo}>{policy.policyNumber || "—"}</div>
            <div className={styles.headerInsured}>Insured: {policy.customer?.fullName || "—"}</div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.editBtn} title="Editing is not available yet">
            <FiEdit2 /> Edit Policy
          </button>
          <button type="button" className={styles.deleteBtn} onClick={handleDelete} disabled={deleting}>
            <FiTrash2 /> {deleting ? "Deleting..." : "Delete Policy"}
          </button>
        </div>
      </div>

      <div className={styles.grid2}>
        <Section icon={<FiUser />} title="Insured Details" subtitle="Information about the policyholder" defaultOpen>
          <div className={styles.fieldGrid}>
            <Field icon={<FiUser />} label="Insured Name" value={dashIfEmpty(policy.customer?.fullName)} />
            <Field icon={<FiUser />} label="Insured Email" value={dashIfEmpty(policy.customer?.email)} />
            <Field icon={<FiUser />} label="Insured Number" value={dashIfEmpty(policy.customer?.mobile)} />
            <Field icon={<FiUser />} label="Sub Insured" value={dashIfEmpty(policy.subInsured || policy.customer?.subClientName)} />
            <Field icon={<FiUser />} label="Address" value={dashIfEmpty(policy.customer?.address)} />
          </div>
        </Section>

        <Section icon={<FiUser />} title="Assignment" subtitle="Policy assignment and sales">
          <div className={styles.fieldGrid}>
            <Field icon={<FiUser />} label="Branch Name" value={dashIfEmpty(policy.assignment?.branchName)} />
            <Field icon={<FiUser />} label="POSP Partner" value={dashIfEmpty(policy.assignment?.pospPartner || policy.pospPartner)} />
            <Field icon={<FiUser />} label="Reporting Manager" value={dashIfEmpty(policy.assignment?.reportingManager?.name)} />
            <Field icon={<FiUser />} label="Assigned Agent" value={dashIfEmpty(policy.assignment?.pospAgent?.name)} />
            <Field icon={<FiUser />} label="Created By" value={dashIfEmpty(policy.createdBy)} />
            <Field icon={<FiUser />} label="Last Updated By" value={dashIfEmpty(policy.updatedBy || policy.createdBy)} />
          </div>
        </Section>

        <Section icon={<FiFileText />} title="Policy Information" subtitle="Core policy details and coverage information">
          <div className={styles.fieldGrid}>
            <Field icon={<FiFileText />} label="Policy Number" value={dashIfEmpty(policy.policyNumber)} />
            <Field icon={<FiFileText />} label="Business Segment" value={dashIfEmpty(policy.businessSegment)} />
            <Field icon={<FiUser />} label="Line of Business" value={dashIfEmpty(policy.lineOfBusiness || policy.policyType)} />
            <Field icon={<FiUser />} label="Product" value={dashIfEmpty(policy.product)} />
            <Field icon={<FiUser />} label="Insurance Company" value={dashIfEmpty(policy.insurer)} />
            <Field icon={<FiFileText />} label="Policy Type" value={dashIfEmpty(policy.policyTypeStructure)} />
            <Field icon={<FiFileText />} label="Transaction Type" value={dashIfEmpty(policy.transactionType)} />
            <Field icon={<FiFileText />} label="Remark" value={dashIfEmpty(policy.policyRemark)} />
            <Field icon={<FiCalendar />} label="Start Date" value={formatDate(policy.startDate)} />
            <Field icon={<FiCalendar />} label="End Date" value={formatDate(policy.endDate)} />
            <Field icon={<FiFileText />} label="Medium of Issuance" value={dashIfEmpty(policy.mediumOfIssuance)} />
            <Field icon={<FiCalendar />} label="Month of Entry" value={formatDate(policy.paymentReceivedDate)} />
          </div>
        </Section>

        <Section icon={<FiDollarSign />} title="Payment Details" subtitle="Payment method and transaction details">
          <div className={styles.fieldGrid}>
            <Field icon={<FiDollarSign />} label="Payment Mode" value={dashIfEmpty(policy.paymentDetails?.mode || policy.paymentMode)} />
            <Field icon={<FiCalendar />} label="Payment Received Date" value={formatDate(policy.paymentReceivedDate)} />
            <Field icon={<FiDollarSign />} label="Transaction ID" value={dashIfEmpty(policy.paymentDetails?.transactionId)} />
            <Field icon={<FiDollarSign />} label="Transaction Amount" value={formatInr(policy.paymentDetails?.transactionAmount)} />
            <Field icon={<FiCalendar />} label="Transaction Date" value={formatDate(policy.paymentDetails?.transactionDate)} />
          </div>
        </Section>
      </div>

      {isMotor && (
        <Section icon={<FiFileText />} title="Motor Details" subtitle="Motor insurance specific details">
          <div className={styles.fieldGrid}>
            <Field icon={<FiTruck />} label="Vehicle Type" value={dashIfEmpty(policy.vehicle?.type)} />
            <Field icon={<FiTruck />} label="Fuel Type" value={dashIfEmpty(policy.vehicle?.fuelType)} />
            <Field icon={<FiCalendar />} label="Model Year" value={dashIfEmpty(policy.vehicle?.modelYear)} />
            <Field icon={<FiCalendar />} label="TP Risk Start Date" value={formatDate(policy.startDate)} />
            <Field icon={<FiCalendar />} label="TP Risk End Date" value={formatDate(policy.endDate)} />
            <Field icon={<FiTruck />} label="Model/Items Covered" value={dashIfEmpty(policy.vehicle?.itemsCovered)} />
            <Field icon={<FiTruck />} label="Motor Make" value={dashIfEmpty(policy.vehicle?.make)} />
            <Field icon={<FiFileText />} label="Registration Number" value={dashIfEmpty(policy.vehicle?.number)} />
            <Field icon={<FiPercent />} label="NCB Applicable" value={dashIfEmpty(policy.vehicle?.ncbApplicable)} />
          </div>
        </Section>
      )}

      <Section icon={<FiDollarSign />} title="Premium Breakdown & Commission" subtitle="Detailed premium and commission structure" defaultOpen>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Sum Insured</th>
                <th>Premium Amount</th>
                <th>Commission %</th>
                <th>Commission Amount</th>
              </tr>
            </thead>
            <tbody>
              {premiumRows.map((r: any, i: number) => (
                <tr key={i}>
                  <td>{r.label}</td>
                  <td>{formatInr(r.sumInsured)}</td>
                  <td>{formatInr(r.premiumAmount)}</td>
                  <td>{r.commissionPercent ?? 0}%</td>
                  <td>{formatInr(r.commissionAmount)}</td>
                </tr>
              ))}
              <tr>
                <td>Reward Amount</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>{formatInr(policy.rewardAmount)}</td>
              </tr>
              <tr className={styles.totalRow}>
                <td>Total</td>
                <td>{formatInr(totals.sumInsured)}</td>
                <td>{formatInr(totals.premiumAmount)}</td>
                <td>—</td>
                <td>{formatInr(totals.commissionAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.fieldGrid} style={{ marginTop: 16 }}>
          <Field icon={<FiDollarSign />} label="Service Tax/GST (18%)" value={formatInr(policy.gstAmount)} />
          <Field icon={<FiDollarSign />} label="Gross Premium" value={formatInr(policy.grossPremium)} />
          <Field icon={<FiDollarSign />} label="Reward Status" value={dashIfEmpty(policy.rewardStatus)} />
          <Field icon={<FiDollarSign />} label="Commission Received Remarks" value={dashIfEmpty(policy.commissionRemark)} />
        </div>
      </Section>

      <Section icon={<FiFileText />} title="Attached Documents" subtitle={`${documents.length} file(s) attached to this policy`}>
        {documents.length === 0 ? (
          <div className={styles.emptyDocs}>No documents attached.</div>
        ) : (
          <div className={styles.docList}>
            {documents.map((doc, i) => (
              <div key={i} className={styles.docItem}>
                <span className={styles.docIcon}>
                  <FiFileText />
                </span>
                <span className={styles.docName}>{doc.fileName}</span>
                <div className={styles.docActions}>
                  <button type="button" onClick={() => viewFile(doc.data)} title="View">
                    <FiEye />
                  </button>
                  <button type="button" onClick={() => downloadFile(doc.data, doc.fileName)} title="Download">
                    <FiDownload />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
};

export default PolicyDetailView;
