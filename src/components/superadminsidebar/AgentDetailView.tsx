"use client";

import React, { useEffect, useState } from "react";
import styles from "@/styles/components/superadminsidebar/PolicyDetailView.module.css";
import {
  FiArrowLeft,
  FiChevronUp,
  FiChevronDown,
  FiUser,
  FiFileText,
  FiEye,
  FiEyeOff,
  FiEdit2,
  FiDownload,
  FiMail,
  FiPhone,
  FiCreditCard,
  FiMapPin,
  FiKey,
  FiPaperclip,
  FiCalendar,
} from "react-icons/fi";

interface AgentDetailViewProps {
  agentId: string;
  onBack: () => void;
  // Passed down from the POSP Management list row rather than re-derived
  // here: the raw Agent document's own `trainingCompleted` field is
  // actually the exam-pass flag (see posp-management.ts), not "watched
  // all training videos" — that real signal only exists by joining the
  // separate TrainingProgress collection, which the list endpoint already
  // does. Re-deriving it from getAgentById alone would silently show the
  // wrong value.
  trainingCompleted: boolean;
  assessmentCompleted: boolean;
}

const FILE_BASE = (process.env.NEXT_PUBLIC_UPLOAD_BASE_URL as string) || "/uploads";

const getFileUrl = (filename?: string | null) => {
  if (!filename) return null;
  if (filename.startsWith("http://") || filename.startsWith("https://")) return filename;
  return `${FILE_BASE.replace(/\/$/, "")}/${filename.replace(/^\//, "")}`;
};

const openFile = (file?: string | null) => {
  if (!file) return;
  if (file.startsWith("data:")) {
    const win = window.open("", "_blank");
    win?.document.write(
      `<html><body style="margin:0"><iframe src="${file}" style="border:none;width:100%;height:100%"></iframe></body></html>`
    );
    return;
  }
  const url = getFileUrl(file);
  if (url) window.open(url, "_blank");
};

const downloadFile = (file?: string | null, name?: string) => {
  if (!file) return;
  const url = file.startsWith("data:") ? file : getFileUrl(file) || "";
  if (!url) return;
  const a = document.createElement("a");
  a.href = url;
  a.download = name || "document";
  a.click();
};

const dash = (v?: string | number | null) => (v === undefined || v === null || v === "" ? "—" : v);

const formatDate = (d?: string | null) => {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const mask = (value?: string | null, keepStart = 1, keepEnd = 1) => {
  if (!value) return "—";
  if (value.length <= keepStart + keepEnd) return value;
  const stars = "*".repeat(Math.max(3, value.length - keepStart - keepEnd));
  return `${value.slice(0, keepStart)}${stars}${value.slice(-keepEnd)}`;
};

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

interface MaskedFieldProps {
  icon?: React.ReactNode;
  label: string;
  value?: string | null;
  keepStart?: number;
  keepEnd?: number;
}

const MaskedField: React.FC<MaskedFieldProps> = ({ icon, label, value, keepStart = 1, keepEnd = 1 }) => {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className={styles.field}>
      <span className={styles.fieldIcon}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div className={styles.fieldLabel}>{label}</div>
        <div className={styles.fieldWithActions}>
          <span className={styles.fieldValue}>
            {revealed ? dash(value) : mask(value, keepStart, keepEnd)}
          </span>
          <span style={{ display: "flex", gap: 4 }}>
            <button
              type="button"
              className={styles.fieldActionBtn}
              onClick={() => setRevealed((r) => !r)}
              title={revealed ? "Hide" : "Reveal"}
            >
              {revealed ? <FiEyeOff size={15} /> : <FiEye size={15} />}
            </button>
            <button type="button" className={styles.fieldActionBtn} title="Edit">
              <FiEdit2 size={14} />
            </button>
          </span>
        </div>
      </div>
    </div>
  );
};

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

interface DocCardProps {
  label: string;
  file?: string | null;
}

const DocCard: React.FC<DocCardProps> = ({ label, file }) => (
  <div className={styles.docCard}>
    <div className={styles.docCardLabel}>{label}</div>
    {file ? (
      <div className={styles.docCardRow}>
        <span className={styles.docThumb}>
          <FiFileText size={16} />
        </span>
        <span className={styles.docName}>{label.replace(/\s+/g, "").toUpperCase()}.jpeg</span>
        <span className={styles.docActions}>
          <button type="button" onClick={() => openFile(file)} title="View">
            <FiEye size={15} />
          </button>
          <button type="button" onClick={() => downloadFile(file, label)} title="Download">
            <FiDownload size={15} />
          </button>
        </span>
      </div>
    ) : (
      <div className={styles.emptyDocs}>Not uploaded</div>
    )}
  </div>
);

const AgentDetailView: React.FC<AgentDetailViewProps> = ({
  agentId,
  onBack,
  trainingCompleted,
  assessmentCompleted,
}) => {
  const [agent, setAgent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingCert, setGeneratingCert] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/getAgentById?id=${agentId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d && !d.error) setAgent(d);
        else setError(d?.error || "Failed to load agent");
      })
      .catch(() => setError("Failed to load agent"))
      .finally(() => setLoading(false));
  }, [agentId]);

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loading}>Loading POSP details...</div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className={styles.wrapper}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          <FiArrowLeft /> Back to Dashboard
        </button>
        <div className={styles.errorBanner}>{error || "POSP not found"}</div>
      </div>
    );
  }

  const fullName = `${agent.firstName || ""} ${agent.lastName || ""}`.trim();
  const address = [agent.city, agent.district, agent.state, agent.pinCode].filter(Boolean).join(", ");

  const kycStatus = (agent.status || "pending").toLowerCase();
  const statusLabel = kycStatus === "rejected" ? "REJECTED" : kycStatus === "pending" ? "PENDING" : "APPROVED";
  const statusTone =
    kycStatus === "rejected" ? styles.statusPillRed : kycStatus === "pending" ? styles.statusPillGray : styles.statusPillBlue;

  // "Onboarded" means the account is active AND the agent has actually
  // finished onboarding — active alone doesn't mean much if they never
  // completed training or passed the assessment.
  const isOnboarded = agent.accountStatus === "active" && trainingCompleted && assessmentCompleted;
  const highestEducationDoc = agent.twelfthMarksheetAttachment || agent.tenthMarksheetAttachment;
  const certificateUrl = agent.certificate || agent.certificate1 || agent.certificate2;

  // Some older agents still have a pre-migration value here — a relative
  // filename (e.g. "certificates/ZNIB1330.pdf") from when certificates
  // were written under public/, which doesn't survive a redeploy and 404s.
  // Certificates are now always stored as base64 data URIs (see
  // generateAgentCertificate.ts) — anything else is stale and needs
  // regenerating, not opening directly.
  const hasValidCertificate = !!certificateUrl && certificateUrl.startsWith("data:");

  // Certificate only ever makes sense once the agent has actually watched
  // all training modules AND passed the assessment — gate on both. A
  // missing/stale certificate doesn't block the button once eligible,
  // since clicking it will just (re)generate a fresh one.
  const certificateEligible = trainingCompleted && assessmentCompleted;
  const certButtonTitle = !trainingCompleted
    ? "Training not yet completed"
    : !assessmentCompleted
    ? "Assessment not yet passed"
    : hasValidCertificate
    ? "Download Certificate"
    : "Generate & download certificate";

  const handleDownloadCertificate = async () => {
    if (hasValidCertificate) {
      openFile(certificateUrl);
      return;
    }
    setGeneratingCert(true);
    try {
      const res = await fetch("/api/createCertificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        alert(data.message || "Could not generate certificate");
        return;
      }
      setAgent((prev: any) => ({ ...prev, certificate: data.url }));
      openFile(data.url);
    } catch (err) {
      console.log("GENERATE CERTIFICATE ERROR", err);
      alert("Could not generate certificate");
    } finally {
      setGeneratingCert(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.topRow}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          <FiArrowLeft /> Back to Dashboard
        </button>

        <div className={styles.topRowActions}>
          <span className={`${styles.statusPill} ${statusTone}`}>{statusLabel}</span>
          <button
            type="button"
            className={styles.certBtn}
            disabled={!certificateEligible || generatingCert}
            title={certButtonTitle}
            onClick={handleDownloadCertificate}
          >
            <FiDownload size={14} /> {generatingCert ? "Generating..." : "Download Certificate"}
          </button>
          <span className={`${styles.statusPill} ${isOnboarded ? styles.statusPillGreen : styles.statusPillGray}`}>
            {isOnboarded ? "ONBOARDED" : "NOT ONBOARDED"}
          </span>
        </div>
      </div>

      <Section icon={<FiUser />} title="POSP Details" subtitle="Information about the POSP" defaultOpen>
        <div className={styles.fieldGrid}>
          <Field icon={<FiUser size={15} />} label="Name" value={dash(fullName.toUpperCase())} />
          <Field icon={<FiMail size={15} />} label="POSP Email" value={dash(agent.email)} />
          <Field icon={<FiPhone size={15} />} label="Phone Number" value={dash(agent.phone)} />
          <Field icon={<FiCreditCard size={15} />} label="Pancard" value={dash(agent.panNumber)} />
          <Field icon={<FiMapPin size={15} />} label="Address" value={dash(address)} />
          <Field icon={<FiKey size={15} />} label="IRDAI POSP Code" value={dash(agent.agentCode)} />
        </div>
      </Section>

      <Section icon={<FiFileText />} title="Attached Documents" subtitle="KYC and other uploaded documents">
        <div className={styles.docGrid}>
          <DocCard label="PAN Card" file={agent.panAttachment} />
          <DocCard label="Aadhaar" file={agent.adhaarAttachment} />
          <DocCard label="Highest Education Certificate" file={highestEducationDoc} />
          <DocCard label="Photo" file={agent.profileImage} />
        </div>
      </Section>

      <Section icon={<FiCreditCard />} title="Bank Account Details" subtitle="Bank accounts for payout processing">
        <h4 className={styles.subHeading}>Bank Account Details</h4>
        <div className={styles.fieldGrid}>
          <MaskedField
            icon={<FiUser size={15} />}
            label="Account Holder"
            value={agent.accountHolderName}
            keepStart={1}
            keepEnd={1}
          />
          <MaskedField
            icon={<FiCreditCard size={15} />}
            label="Account Number"
            value={agent.accountNumber}
            keepStart={0}
            keepEnd={4}
          />
          <MaskedField icon={<FiKey size={15} />} label="IFSC Code" value={agent.ifscCode} keepStart={2} keepEnd={2} />
          <MaskedField
            icon={<FiFileText size={15} />}
            label="Bank Name"
            value={agent.bankName}
            keepStart={1}
            keepEnd={1}
          />
        </div>
        <div style={{ marginTop: 18 }}>
          <div className={styles.docCardLabel}>Cancelled Cheque</div>
          <DocCard label="Cancelled Cheque" file={agent.cancelledChequeAttachment} />
        </div>
      </Section>

      <Section icon={<FiPaperclip />} title="Training Details" subtitle="Information about the POSP Training">
        <div className={styles.fieldGrid}>
          <Field
            icon={<FiCalendar size={15} />}
            label="Training Completed"
            value={trainingCompleted ? "Yes" : "No"}
          />
          <Field
            icon={<FiCalendar size={15} />}
            label="Assessment Completed"
            value={assessmentCompleted ? "Yes" : "No"}
          />
          <Field icon={<FiCalendar size={15} />} label="Assessment Score" value={dash(agent.trainingScore)} />
          <Field icon={<FiCalendar size={15} />} label="Total Marks" value={dash(agent.trainingTotal)} />
          <Field
            icon={<FiCalendar size={15} />}
            label="Completed On"
            value={formatDate(agent.trainingCompletedAt)}
          />
        </div>
      </Section>
    </div>
  );
};

export default AgentDetailView;
