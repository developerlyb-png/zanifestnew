"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "@/styles/components/superadminsidebar/Claims.module.css";
import { toast } from "react-hot-toast";
import {
  FiArrowLeft,
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiEdit2,
  FiFileText,
  FiMapPin,
  FiPaperclip,
  FiTrash2,
  FiUpload,
  FiUser,
  FiEye,
  FiClock,
  FiCalendar,
  FiPhone,
  FiPackage,
  FiShield,
} from "react-icons/fi";
import CreateClaim from "./CreateClaim";
import { statusColor } from "@/constants/claims";

interface Props {
  claimId: string;
  onBack: () => void;
}

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" }) : "—";
const fmtDateTime = (d?: string) =>
  d
    ? new Date(d).toLocaleString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";
const fmtUploaded = (d?: string) =>
  d
    ? new Date(d)
        .toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })
        .replace(",", "")
        .replace(/ (am|pm)$/i, (m) => m.toLowerCase())
    : "";
const fmtInr = (n?: number) => `₹${(n || 0).toLocaleString("en-IN")}`;
const fmtSize = (n?: number) =>
  !n ? "" : n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

const esc = (v: any) =>
  String(v ?? "—").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

// Module-level so it keeps identity (and its own open state) across renders.
function Section({
  icon,
  title,
  sub,
  defaultOpen,
  right,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  defaultOpen?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className={styles.dCard}>
      <button type="button" className={styles.dCardHead} onClick={() => setOpen((o) => !o)}>
        <span className={styles.reviewIcon}>{icon}</span>
        <span className={styles.reviewHeadText}>
          <span className={styles.reviewTitle}>{title}</span>
          <span className={styles.reviewSub}>{sub}</span>
        </span>
        {right}
        {open ? <FiChevronUp /> : <FiChevronDown />}
      </button>
      {open && <div className={styles.dCardBody}>{children}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const c = statusColor(status);
  return (
    <span className={styles.statusPill} style={{ background: c.bg, color: c.fg }}>
      {status}
    </span>
  );
}

const Row = ({ k, v, icon }: { k: string; v?: React.ReactNode; icon?: React.ReactNode }) => (
  <div className={styles.dRow}>
    {icon && <span className={styles.dRowIcon}>{icon}</span>}
    <div className={styles.dRowText}>
      <span className={styles.dKey}>{k}</span>
      <span className={styles.dVal}>{v || "—"}</span>
    </div>
  </div>
);

export default function ClaimDetailView({ claimId, onBack }: Props) {
  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/claims?id=${claimId}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setClaim(data.claim);
      } else {
        setClaim(null);
      }
    } catch {
      setClaim(null);
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    load();
  }, [load]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 8 * 1024 * 1024) {
          toast.error(`${file.name} is larger than 8 MB`);
          continue;
        }
        const data = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = reject;
          r.readAsDataURL(file);
        });
        const res = await fetch("/api/admin/claim-documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id: claimId, name: file.name, mimeType: file.type, data }),
        });
        const json = await res.json();
        if (!json.success) {
          toast.error(json.message || `Failed to upload ${file.name}`);
          continue;
        }
        json.documents ? setClaim((c: any) => ({ ...c, documents: json.documents })) : load();
        toast.success(`${file.name} uploaded`);
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const fetchDoc = async (docId: string) => {
    const res = await fetch(`/api/admin/claims?id=${claimId}&docId=${docId}`, { credentials: "include" });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.document;
  };

  const viewDoc = async (docId: string) => {
    try {
      const d = await fetchDoc(docId);
      const blob = await (await fetch(d.data)).blob();
      window.open(URL.createObjectURL(blob), "_blank");
    } catch (e: any) {
      toast.error(e.message || "Could not open document");
    }
  };

  const downloadDoc = async (docId: string) => {
    try {
      const d = await fetchDoc(docId);
      const a = document.createElement("a");
      a.href = d.data;
      a.download = d.name;
      a.click();
    } catch (e: any) {
      toast.error(e.message || "Could not download document");
    }
  };

  const deleteDoc = async (docId: string) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      const res = await fetch("/api/admin/claim-documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: claimId, docId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      json.documents ? setClaim((c: any) => ({ ...c, documents: json.documents })) : load();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  };

  const downloadReport = () => {
    if (!claim) return;
    const w = window.open("", "_blank");
    if (!w) return toast.error("Allow pop-ups to download the report");
    const isNEB = claim.claimType === "Non Employee Benefit";
    const rows: [string, any][] = [
      ["Claim No", claim.claimNumber],
      ["Status", claim.status],
      ["Claim Type", claim.claimType],
      ["Policy Number", claim.policyNumber],
      ["Product Code", claim.productCode],
      ["Insured Name", claim.insuredName],
      ["Contact Mobile", claim.contactMobile],
      ["Contact Email", claim.contactEmail],
      ["Insurer", claim.insurer],
      ["Date of Loss", fmtDate(claim.dateOfLoss)],
      ["Reported On", fmtDateTime(claim.reportedOn)],
      ["Reported Via", claim.reportedChannel],
      ["Estimated Amount", fmtInr(claim.estimatedAmount)],
      ["Claimed Amount", fmtInr(claim.claimedAmount)],
      ["Approved Amount", fmtInr(claim.approvedAmount)],
      ["Claim Summary", claim.claimDetails || claim.specialRemark],
      ...(isNEB
        ? ([
            ["Loss Cause", claim.lossCause],
            ["Loss Details", claim.lossDetails],
            ["Site Address", claim.siteAddress],
            ["City / State / PIN", [claim.city, claim.state, claim.sitePinCode].filter(Boolean).join(", ")],
          ] as [string, any][])
        : ([
            ["Patient Name", claim.patientName],
            ["Hospital Name", claim.hospitalName],
            ["Diagnosis", claim.diagnosis],
            ["Admission Date", fmtDate(claim.admissionDate)],
            ["Discharge Date", fmtDate(claim.dischargeDate)],
          ] as [string, any][])),
    ];
    const timeline = (claim.timeline || [])
      .slice()
      .reverse()
      .map(
        (t: any) =>
          `<tr><td>${esc(t.status)}</td><td>${esc(fmtDateTime(t.at))}</td><td>${esc(t.by)}</td><td>${esc(t.note || "")}</td></tr>`
      )
      .join("");
    w.document.write(`<!doctype html><html><head><title>Claim ${esc(claim.claimNumber)}</title>
<style>body{font-family:Arial,sans-serif;padding:28px;color:#111}h1{font-size:20px}h2{font-size:15px;margin-top:24px}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:7px 10px;font-size:13px;text-align:left;vertical-align:top}
th{background:#f3f4f6}td:first-child{font-weight:600;width:200px}</style></head><body>
<h1>Claim Report - ${esc(claim.claimNumber)}</h1>
<table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table>
<h2>Claim Timeline</h2>
<table><tr><th>Status</th><th>Date</th><th>By</th><th>Remark</th></tr>${timeline}</table>
<script>window.onload=function(){window.print()}</script></body></html>`);
    w.document.close();
  };

  if (loading) return <div className={styles.dLoading}>Loading claim...</div>;
  if (!claim) {
    return (
      <div className={styles.dWrap}>
        <button className={styles.dBack} onClick={onBack}>
          <FiArrowLeft /> Back to Claims
        </button>
        <div className={styles.dLoading}>Claim not found.</div>
      </div>
    );
  }

  if (editing) {
    return (
      <CreateClaim
        initial={claim}
        onCancel={() => setEditing(false)}
        onCreated={() => {
          setEditing(false);
          load();
        }}
      />
    );
  }

  const isNEB = claim.claimType === "Non Employee Benefit";
  const timeline: any[] = (
    claim.timeline?.length
      ? claim.timeline
      : [{ status: claim.status, at: claim.createdAt, by: claim.createdBy, note: claim.specialRemark }]
  )
    .slice()
    .reverse();
  const docs: any[] = claim.documents || [];

  return (
    <div className={styles.dWrap}>
      <button className={styles.dBack} onClick={onBack}>
        <FiArrowLeft /> Back to Claims
      </button>

      <div className={styles.dHeader}>
        <div className={styles.dHeaderLeft}>
          <span className={styles.dFileIcon}>
            <FiFileText />
          </span>
          <div>
            <div className={styles.dClaimNo}>{claim.claimNumber}</div>
            <div className={styles.dHeaderSub}>
              Claim Details <StatusBadge status={claim.status} />
            </div>
          </div>
        </div>
        <div className={styles.dHeaderActions}>
          <button className={styles.dEditBtn} onClick={() => setEditing(true)}>
            <FiEdit2 /> Edit
          </button>
          <button className={styles.dOutlineBtn} onClick={downloadReport}>
            <FiDownload /> Download Report
          </button>
        </div>
      </div>

      <div className={styles.dCols}>
        <div className={styles.dMain}>
      <Section icon={<FiFileText />} title="Claim Information" sub="Basic claim details" defaultOpen>
        <div className={styles.dGrid}>
          <Row icon={<FiFileText />} k="Claim Type" v={claim.claimType} />
          <Row icon={<FiFileText />} k="Policy Number" v={claim.policyNumber} />
          <Row icon={<FiPackage />} k="Product Code" v={claim.productCode} />
          <Row icon={<FiShield />} k="Insurer" v={claim.insurer} />
          <Row icon={<FiCalendar />} k="Date of Loss" v={fmtDate(claim.dateOfLoss)} />
          <Row icon={<FiClock />} k="Reported On" v={fmtDateTime(claim.reportedOn)} />
          <Row icon={<FiPhone />} k="Reported Via" v={claim.reportedChannel} />
          <Row icon={<FiClock />} k="Last Updated" v={fmtDateTime(claim.updatedAt)} />
        </div>

        <div className={styles.dSummary}>
          <div className={styles.dSummaryLabel}>Claim Summary</div>
          {claim.claimDetails || claim.specialRemark || "—"}
        </div>

        <div className={styles.dFinTitle}>FINANCIAL DETAILS</div>
        <div className={`${styles.dFinRow} ${styles.finGrey}`}>
          <span>Estimated</span>
          <b>{fmtInr(claim.estimatedAmount)}</b>
        </div>
        <div className={`${styles.dFinRow} ${styles.finBlue}`}>
          <span>Claimed</span>
          <b>{fmtInr(claim.claimedAmount)}</b>
        </div>
        <div className={`${styles.dFinRow} ${styles.finGreen}`}>
          <span>Approved</span>
          <b>{fmtInr(claim.approvedAmount)}</b>
        </div>
      </Section>


      <Section icon={<FiUser />} title="Insured & Contact Information" sub="Policyholder details">
        <div className={styles.dGrid}>
          <Row k="Insured Name" v={claim.insuredName} />
          <Row k="Contact Mobile" v={claim.contactMobile} />
          <Row k="Contact Email" v={claim.contactEmail} />
          <Row k="Line of Business" v={claim.lineOfBusiness} />
        </div>
      </Section>

      <Section
        icon={<FiMapPin />}
        title={isNEB ? "Loss Details" : "Hospitalization Details"}
        sub={isNEB ? "Location and loss information" : "Patient and hospital information"}
      >
        <div className={styles.dGrid}>
          {isNEB ? (
            <>
              <Row k="Loss Cause" v={claim.lossCause} />
              <Row k="Loss Details" v={claim.lossDetails} />
              <Row k="Site Address" v={claim.siteAddress} />
              <Row k="City" v={claim.city} />
              <Row k="State" v={claim.state} />
              <Row k="PIN Code" v={claim.sitePinCode} />
            </>
          ) : (
            <>
              <Row k="Patient Name" v={claim.patientName} />
              <Row k="Hospital Name" v={claim.hospitalName} />
              <Row k="Diagnosis" v={claim.diagnosis} />
              <Row k="Admission Date" v={fmtDate(claim.admissionDate)} />
              <Row k="Discharge Date" v={fmtDate(claim.dischargeDate)} />
            </>
          )}
        </div>
      </Section>

      <Section
        icon={<FiPaperclip />}
        title="Attached Documents"
        sub={docs.length ? `${docs.length} file(s) attached` : "No files attached"}
        defaultOpen
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
        <button
          type="button"
          className={styles.uploadDocBtn}
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          <FiUpload /> {uploading ? "Uploading..." : "Upload Document"}
        </button>
        {docs.map((d) => (
          <div className={styles.docRow} key={d._id}>
            <span className={styles.docTile}>
              <FiFileText />
            </span>
            <div className={styles.docInfo}>
              <div className={styles.docName}>{d.name}</div>
              <div className={styles.docMeta}>
                Uploaded {fmtUploaded(d.uploadedAt)}
                {d.uploadedBy ? ` by ${d.uploadedBy}` : ""}
              </div>
            </div>
            <button className={styles.docAct} title="View" onClick={() => viewDoc(d._id)}>
              <FiEye />
            </button>
            <button className={styles.docAct} title="Download" onClick={() => downloadDoc(d._id)}>
              <FiDownload />
            </button>
            <button className={`${styles.docAct} ${styles.docDel}`} title="Delete" onClick={() => deleteDoc(d._id)}>
              <FiTrash2 />
            </button>
          </div>
        ))}
      </Section>
        </div>
        <div className={styles.dSide}>
      <Section
        icon={<FiClock />}
        title="Claim Timeline"
        sub={`${timeline.length} updates`}
        defaultOpen
      >
        <div className={styles.tlList}>
          {timeline.length === 0 && <div className={styles.dMuted}>No timeline entries yet.</div>}
          {timeline.map((t, i) => {
            const c = statusColor(t.status);
            return (
              <div className={styles.tlItem} key={t._id || i}>
                <span className={styles.tlDot} style={{ background: c.dot }} />
                <div className={styles.tlBody}>
                  <div className={styles.tlStatus} style={{ color: c.fg }}>{t.status}</div>
                  <div className={styles.tlTime}>
                    <FiClock size={11} /> {fmtDateTime(t.at)}
                  </div>
                  <div className={styles.tlBy}>by {t.by || "—"}</div>
                  {t.note && <div className={styles.tlNote}>{t.note}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </Section>
        </div>
      </div>
    </div>
  );
}
