"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FiSearch, FiInbox, FiClock, FiCheckCircle, FiXCircle, FiUsers, FiRefreshCw } from "react-icons/fi";
import axios from "axios";
import Select from "react-select";

import styles from "@/styles/components/superadminsidebar/reviewApplications.module.css";

interface AgentData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  agentCode?: string;
  phone?: string;
  city?: string;
  district?: string;
  state?: string;
  pinCode?: string;

  panNumber?: string;
  panAttachment?: string;

  adhaarNumber?: string;
  adhaarAttachment?: string;
adhaarBackAttachment?: string;
  // ✅ ADD THESE
  yearofpassing10th?: string;
  tenthMarksheetAttachment?: string;

  yearofpassing12th?: string;
  twelfthMarksheetAttachment?: string;

  nomineeName?: string;
  nomineeRelation?: string;
  nomineeAadharNumber?: string;
  nomineePanNumber?: string;

  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchLocation?: string;
  cancelledChequeAttachment?: string;

  assignedTo?: string;
  status?: string;

  trainingCompleted?: boolean;
  rejectionRemark?: string;
  adminSeenAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

type ApplicationCounts = {
  total: number;
  new: number;
  pending: number;
  approved: number;
  rejected: number;
};

type ApplicationTab = "all" | "new" | "pending" | "approved" | "rejected";

const EMPTY_COUNTS: ApplicationCounts = { total: 0, new: 0, pending: 0, approved: 0, rejected: 0 };

// Lets the sidebar "Review Application" badge refresh right after a change here
export const APPLICATIONS_CHANGED_EVENT = "reviewApplications:changed";
const notifyApplicationsChanged = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(APPLICATIONS_CHANGED_EVENT));
};

const isNewApplication = (a: AgentData) => a.status === "pending" && !a.adminSeenAt;

// "reviewed" = approved by admin (agent now in training); "approved" = certified
const statusInfo = (a: AgentData): { label: string; stage: string; tone: string } => {
  switch (a.status) {
    case "pending":
      return { label: "Pending", stage: "Awaiting review", tone: "pending" };
    case "reviewed":
      return {
        label: "Approved",
        stage: a.trainingCompleted ? "Training completed" : "In training",
        tone: "approved",
      };
    case "approved":
      return { label: "Approved", stage: "Certified", tone: "approved" };
    case "rejected":
      return { label: "Rejected", stage: "Awaiting resubmission", tone: "rejected" };
    default:
      return { label: a.status || "-", stage: "", tone: "pending" };
  }
};

const formatDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "-";

type VerificationState = "pending" | "approved" | "rejected";

export default function ReviewApplications() {
  const [managerSearch, setManagerSearch] = useState("");
  const [applications, setApplications] = useState<AgentData[]>([]);
  const [counts, setCounts] = useState<ApplicationCounts>(EMPTY_COUNTS);
  const [tab, setTab] = useState<ApplicationTab>("all");
  const [search, setSearch] = useState("");
  const [listLoading, setListLoading] = useState(true);
  const [selected, setSelected] = useState<AgentData | null>(null);
  const [managerList, setManagerList] = useState<any[]>([]);
  const [assignManager, setAssignManager] = useState("");
  const [irdaiVerified, setIrdaiVerified] = useState(false);
const [iibVerified, setIibVerified] = useState(false);
 const managerOptions = managerList.map((m) => ({
    value: m.managerId,
    label: `${m.firstName ?? ""} ${m.lastName ?? ""} (${m.managerId})`,
  }));
  // local verification states for currently selected agent
  const [panStatus, setPanStatus] = useState<VerificationState>("pending");
  const [aadhaarStatus, setAadhaarStatus] =
    useState<VerificationState>("pending");
    const [aadhaarBackStatus, setAadhaarBackStatus] =
  useState<VerificationState>("pending");
  const [remark, setRemark] = useState("");
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [tenthStatus, setTenthStatus] = useState<VerificationState>("pending");
const [editMode, setEditMode] = useState(false);
  const [bankStatus, setBankStatus] = useState<VerificationState>("pending");

  // base URL for file preview — change via NEXT_PUBLIC_UPLOAD_BASE_URL if needed
  const FILE_BASE =
    (process.env.NEXT_PUBLIC_UPLOAD_BASE_URL as string) || "/uploads";

  const load = async () => {
    try {
      const res = await axios.get("/api/admin/agentApplications");
      setApplications(res.data?.applications || []);
      setCounts(res.data?.counts || EMPTY_COUNTS);
    } catch (err) {
      console.error("Failed to load applications", err);
    } finally {
      setListLoading(false);
    }
  };

  const filteredApplications = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((a) => {
      if (tab === "new" && !isNewApplication(a)) return false;
      if (tab === "pending" && a.status !== "pending") return false;
      if (tab === "approved" && a.status !== "reviewed" && a.status !== "approved") return false;
      if (tab === "rejected" && a.status !== "rejected") return false;
      if (!q) return true;
      return [
        `${a.firstName || ""} ${a.lastName || ""}`,
        a.email,
        a.phone,
        a.agentCode,
        a.city,
        a.district,
        a.state,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [applications, tab, search]);

  // Opening a "New" application marks it as seen
  const markSeen = async (agent: AgentData) => {
    if (!isNewApplication(agent)) return;
    const seenAt = new Date().toISOString();
    setApplications((prev) => prev.map((a) => (a._id === agent._id ? { ...a, adminSeenAt: seenAt } : a)));
    setCounts((c) => ({ ...c, new: Math.max(0, c.new - 1) }));
    try {
      await axios.post("/api/admin/markApplicationSeen", { agentId: agent._id });
      notifyApplicationsChanged();
    } catch (err) {
      console.error("markApplicationSeen error", err);
    }
  };

  useEffect(() => {
    load();
  }, []);
const handleUpdateAgent = async () => {
  try {

    const { _id, ...data } = selected!;

    await axios.patch("/api/admin/updateAgent", {
      agentId: _id,
      ...data
    });

    alert("Agent updated successfully");

    setEditMode(false);
    load();

  } catch (err) {
    console.error(err);
    alert("Update failed");
  }
};
  const openReview = async (agent: AgentData) => {
    markSeen(agent);
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/getAgentById?id=${agent._id}`);
      setSelected(res.data);

      const res2 = await axios.get("/api/managers/agentDistrictDropdown");
      setManagerList(res2.data.managers || []);

      // reset verification state for modal — must reset ALL fields, not just
      // PAN/Aadhaar, otherwise a previously-reviewed agent's statuses leak
      // into the next agent opened in the same admin session.
      setPanStatus("pending");
      setAadhaarStatus("pending");
      setAadhaarBackStatus("pending");
      setTenthStatus("pending");
      setBankStatus("pending");
      setRemark("");
      setAssignManager(res.data?.assignedTo || "");
      setIrdaiVerified(false);
      setIibVerified(false);
    } catch (err) {
      console.error("openReview error", err);
    } finally {
      setLoading(false);
    }
  };
  const filteredManagers = managerList.filter((m) =>
  `${m.firstName || ""} ${m.lastName || ""} ${m.managerId || ""}`
    .toLowerCase()
    .includes(managerSearch.toLowerCase())
);
  const renderPreview = (file?: string) => {
    if (!file)
      return <div className={styles.noPreview}>No document uploaded</div>;

    // PDF file
    if (file.startsWith("data:application/pdf")) {
      return (
        <iframe
          src={file}
          className={styles.docPreview}
          style={{ border: "none" }}
          title="PDF Preview"
        />
      );
    }

    // Image file
    if (file.startsWith("data:image")) {
      return (
        <img src={file} className={styles.docPreview} alt="Document Preview" />
      );
    }

    // fallback (old filename based uploads)
    const url = getFileUrl(file);
    return url ? (
      <img src={url} className={styles.docPreview} alt="Document" />
    ) : (
      <div className={styles.noPreview}>Preview not available</div>
    );
  };
  const openInNewTab = (file?: string) => {
    if (!file) return;

    if (file.startsWith("data:")) {
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(`
        <html>
          <body style="margin:0">
            <iframe 
              src="${file}" 
              style="border:none;width:100%;height:100%" 
            ></iframe>
          </body>
        </html>
      `);
      }
      return;
    }

    const url = getFileUrl(file);
    if (url) window.open(url, "_blank");
  };

  // When user approves/rejects overall application (final action)
  const handleReview = async (action: "accept" | "reject") => {
    if (verificationIncomplete) {
      alert("Please complete verification of all uploaded documents before final review.");
      return;
    }

    if (remarkMissing) {
      alert("Please add a remark explaining rejection.");
      return;
    }

    if (!selected) return;

    if (action === "accept" && !(irdaiVerified && iibVerified)) {
      alert("Please complete both IRDAI and IIB verification before approving.");
      return;
    }

    if (action === "accept" && !assignManager) {
      alert("Please assign a District Manager before approving.");
      return;
    }

    if (action === "accept" && anyRejected) {
      alert("This application has a rejected document. Please resolve the rejection before approving.");
      return;
    }

    try {
      if (action === "accept") setApproveLoading(true);
      if (action === "reject") setRejectLoading(true);

      await axios.post("/api/admin/reviewAgent", {
        agentId: selected._id,
        action,
        assignManager,
        verification: {
          panStatus,
          aadhaarStatus,
          aadhaarBackStatus,
          tenthStatus,
          bankStatus,
        },
        remark: remark.trim(),
      });

      alert(`Application ${action === "accept" ? "Approved" : "Rejected"}!`);
      setSelected(null);
      setAssignManager("");
      setRemark("");
      load();
      notifyApplicationsChanged();
    } catch (err) {
      console.error("handleReview error", err);
      alert("Something went wrong while submitting review.");
    } finally {
      setApproveLoading(false);
      setRejectLoading(false);
    }
  };

  // IRDAI link open (keeps same behavior) — marks IRDAI step done
  const handleIrdaiClick = () => {
    window.open(
      "https://agencyportal.irdai.gov.in/PublicAccess/LookUpPAN.aspx",
      "_blank"
    );
    setIrdaiVerified(true);
  };
  // Shared verification-completeness checks — used by both the final
  // Approve/Reject buttons' disabled state AND handleReview's own guard, so
  // the two can never drift out of sync (a button that isn't disabled but
  // whose click silently no-ops via handleReview's alert looks "broken").
  // Educational certificate/cancelled-cheque are only required when actually uploaded.
  const verificationIncomplete =
    panStatus === "pending" ||
    aadhaarStatus === "pending" ||
    aadhaarBackStatus === "pending" ||
    (!!selected?.tenthMarksheetAttachment && tenthStatus === "pending") ||
    (!!selected?.cancelledChequeAttachment && bankStatus === "pending");

  const anyRejected =
    panStatus === "rejected" ||
    aadhaarStatus === "rejected" ||
    aadhaarBackStatus === "rejected" ||
    tenthStatus === "rejected" ||
    bankStatus === "rejected";

  const remarkMissing = anyRejected && !remark.trim();
  const handleIibClick = () => {
  window.open("https://pos.iib.gov.in/", "_blank");
  setIibVerified(true);
};
  // Helpers to get full preview URL when DB stores filename only
  const getFileUrl = (filename?: string | null) => {
    if (!filename) return null;
    // if filename already contains http(s), return as-is
    if (filename.startsWith("http://") || filename.startsWith("https://"))
      return filename;
    // else combine with base path
    return `${FILE_BASE.replace(/\/$/, "")}/${filename.replace(/^\//, "")}`;
  };

  // Approve/reject handlers for pan & aadhaar
  const setPanApproved = () => setPanStatus("approved");

  const setPanRejected = () => setPanStatus("rejected");
  const setAadhaarApproved = () => setAadhaarStatus("approved");
  const setAadhaarRejected = () => setAadhaarStatus("rejected");

  const statCards: { key: ApplicationTab; label: string; value: number; icon: React.ReactNode; tone: string }[] = [
    { key: "all", label: "Total Applications", value: counts.total, icon: <FiUsers />, tone: "total" },
    { key: "new", label: "New", value: counts.new, icon: <FiInbox />, tone: "new" },
    { key: "pending", label: "Pending Approval", value: counts.pending, icon: <FiClock />, tone: "pending" },
    { key: "approved", label: "Approved", value: counts.approved, icon: <FiCheckCircle />, tone: "approved" },
    { key: "rejected", label: "Rejected", value: counts.rejected, icon: <FiXCircle />, tone: "rejected" },
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.dashHeader}>
        <div>
          <h2 className={styles.title}>Review Applications</h2>
          <p className={styles.dashSubtitle}>
            {counts.new > 0
              ? `${counts.new} new application${counts.new > 1 ? "s" : ""} waiting for review`
              : "All agent applications at a glance"}
          </p>
        </div>
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={() => {
            load();
            notifyApplicationsChanged();
          }}
        >
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className={styles.statGrid}>
        {statCards.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`${styles.statCard} ${styles[`stat_${c.tone}`]} ${tab === c.key ? styles.statCardActive : ""}`}
            onClick={() => setTab(c.key)}
          >
            <span className={styles.statIcon}>{c.icon}</span>
            <span className={styles.statBody}>
              <span className={styles.statValue}>{c.value}</span>
              <span className={styles.statLabel}>{c.label}</span>
            </span>
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {statCards.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`${styles.tab} ${tab === c.key ? styles.tabActive : ""}`}
              onClick={() => setTab(c.key)}
            >
              {c.key === "all" ? "All" : c.label}
              <span className={styles.tabCount}>{c.value}</span>
            </button>
          ))}
        </div>

        <div className={styles.searchBox}>
          <FiSearch size={14} />
          <input
            placeholder="Search name, email, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        {listLoading ? (
          <p className={styles.emptyState}>Loading applications...</p>
        ) : filteredApplications.length === 0 ? (
          <p className={styles.emptyState}>No applications found</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Applicant</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Applied On</th>
                <th>Last Updated</th>
                <th>Status</th>
                <th>Assigned Manager</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredApplications.map((a, index) => {
                const info = statusInfo(a);
                const isNew = isNewApplication(a);
                const isPending = a.status === "pending";
                return (
                  <tr
                    key={a._id}
                    className={`${isPending ? styles.tableRow : ""} ${isNew ? styles.newRow : ""}`}
                    onClick={isPending ? () => openReview(a) : undefined}
                  >
                    <td>{index + 1}</td>
                    <td>
                      <div className={styles.applicantName}>
                        {a.firstName} {a.lastName}
                        {isNew && <span className={styles.newBadge}>NEW</span>}
                      </div>
                      <div className={styles.applicantEmail}>{a.email}</div>
                    </td>
                    <td>{a.phone || "-"}</td>
                    <td>{[a.city || a.district, a.state].filter(Boolean).join(", ") || "-"}</td>
                    <td>{formatDate(a.createdAt)}</td>
                    <td>{formatDate(a.updatedAt)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[`status_${info.tone}`]}`}>
                        {info.label}
                      </span>
                      {info.stage && <div className={styles.statusStage}>{info.stage}</div>}
                    </td>
                    <td>{a.assignedTo || "-"}</td>
                    <td>
                      {isPending ? (
                        <button
                          className={styles.reviewBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            openReview(a);
                          }}
                        >
                          Review
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ---------- Modal ---------- */}
      {selected && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox} role="dialog" aria-modal="true">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
  <h2 className={styles.modalTitle}>Review Agent Application</h2>

  {!editMode && (
    <button
      style={{
        background: "#2563eb",
        color: "#fff",
        border: "none",
        padding: "6px 14px",
        borderRadius: "6px",
        cursor: "pointer"
      }}
      onClick={() => setEditMode(true)}
    >
      Edit
    </button>
  )}
</div>

            <div className={styles.modalContent}>
              {/* top grid */}
              
              <div className={styles.grid}>
                 <div className={styles.field}>
  <label>Agent ID</label>
  <input
    readOnly
    value={
      selected
        ? `POSP${String(
            applications.findIndex((a) => a._id === selected._id) + 1
          ).padStart(4, "0")}`
        : ""
    }
  />
</div>
                {/* <div className={styles.field}>
  <label>Agent ID</label>
  <input
  readOnly
  value={
    selected?._id
      ? `${selected._id.toString().slice(-6)}`
      : ""
  }
/>

</div> */}

                <div className={styles.field}>
                  <label>First Name</label>
                  <input
  readOnly={!editMode}
  value={selected.firstName || ""}
  onChange={(e) =>
    setSelected((prev) =>
      prev ? { ...prev, firstName: e.target.value } : prev
    )
  }
/>
                </div>

                <div className={styles.field}>
                  <label>Last Name</label>
                  <input
  readOnly={!editMode}
  value={selected.lastName || ""}
  onChange={(e) =>
    setSelected((prev) =>
      prev ? { ...prev, lastName: e.target.value } : prev
    )
  }
/>
                </div>

                <div className={styles.field}>
                  <label>Email</label>
                  <input readOnly value={selected.email || ""} />
                </div>

                <div className={styles.field}>
                  <label>Phone</label>
                  <input
  readOnly={!editMode}
  value={selected.phone || ""}
  onChange={(e) =>
    setSelected((prev) =>
      prev ? { ...prev, phone: e.target.value } : prev
    )
  }
/>
                </div>

                <div className={styles.field}>
                  <label>City</label>
                 <input
  readOnly={!editMode}
  value={selected.city || ""}
  onChange={(e) =>
    setSelected((prev) =>
      prev ? { ...prev, city: e.target.value } : prev
    )
  }
/>
                </div>

                <div className={styles.field}>
                  <label>District</label>
                  <input
  readOnly={!editMode}
  value={selected.district || ""}
  onChange={(e) =>
    setSelected((prev) =>
      prev ? { ...prev, district: e.target.value } : prev
    )
  }
/>
                </div>

                <div className={styles.field}>
                  <label>State</label>
                  <input
  readOnly={!editMode}
  value={selected.state || ""}
  onChange={(e) =>
    setSelected((prev) =>
      prev ? { ...prev, state: e.target.value } : prev
    )
  }
/>
                </div>

                <div className={styles.field}>
                  <label>PAN Number</label>
                  <input readOnly value={selected.panNumber || ""} />
                </div>

                <div className={styles.field}>
                  <label>Aadhaar Number</label>
                  <input readOnly value={selected.adhaarNumber || ""} />
                </div>
                <div className={styles.field}>
                  <label>Account Holder Name</label>
                  <input readOnly value={selected.accountHolderName || "-"} />
                </div>

                <div className={styles.field}>
                  <label>Bank Name</label>
                  <input readOnly value={selected.bankName || "-"} />
                </div>

                <div className={styles.field}>
                  <label>Account Number</label>
                  <input readOnly value={selected.accountNumber || "-"} />
                </div>

                <div className={styles.field}>
                  <label>IFSC Code</label>
                  <input readOnly value={selected.ifscCode || "-"} />
                </div>

                <div className={styles.field}>
                  <label>Branch Location</label>
                  <input readOnly value={selected.branchLocation || "-"} />
                </div>
              </div>

              {/* Documents + verification */}
          {/* Documents + verification */}
<div className={styles.docsRow}>

  {/* ================= PAN CARD ================= */}
  <div className={styles.docCard}>
    <div className={styles.docHeader}>
      <strong>PAN Card</strong>
      <span className={styles.smallNote}>Preview & verify</span>
    </div>

    <div className={styles.docPreviewWrap}>
      {selected.panAttachment ? (
        selected.panAttachment.startsWith("data:application/pdf") ? (
          <object
            data={selected.panAttachment}
            type="application/pdf"
            className={styles.docPreview}
            onClick={() => openInNewTab(selected.panAttachment)}
          />
        ) : (
          <img
            src={
              selected.panAttachment.startsWith("data:")
                ? selected.panAttachment
                : getFileUrl(selected.panAttachment) || ""
            }
            className={styles.docPreview}
            alt="PAN"
            onClick={() => openInNewTab(selected.panAttachment)}
          />
        )
      ) : (
        <div className={styles.noPreview}>No PAN uploaded</div>
      )}
    </div>

    <div className={styles.verifyRow}>
      <button
        className={`${styles.verifyAction} ${
          panStatus === "approved" ? styles.approved : ""
        }`}
        onClick={() => setPanApproved()}
        disabled={panStatus === "approved"}
      >
        Approve 
      </button>

      <button
        className={`${styles.verifyAction} ${
          panStatus === "rejected" ? styles.reject : ""
        }`}
        onClick={() => setPanRejected()}
        disabled={panStatus === "rejected"}
      >
        Reject 
      </button>

      <div
        className={`${styles.statusPill} ${
          panStatus === "approved" ? styles.pillApproved : ""
        } ${panStatus === "rejected" ? styles.pillRejected : ""}`}
      >
        {panStatus === "pending" && "Pending"}
        {panStatus === "approved" && "Approved"}
        {panStatus === "rejected" && "Rejected"}
      </div>
    </div>
  </div>


  {/* ================= AADHAAR FRONT ================= */}
  <div className={styles.docCard}>
    <div className={styles.docHeader}>
      <strong>Aadhaar Frontside</strong>
      <span className={styles.smallNote}>Preview & verify</span>
    </div>

    <div className={styles.docPreviewWrap}>
      {selected.adhaarAttachment ? (
        selected.adhaarAttachment.startsWith("data:application/pdf") ? (
          <object
            data={selected.adhaarAttachment}
            type="application/pdf"
            className={styles.docPreview}
            onClick={() => openInNewTab(selected.adhaarAttachment)}
          />
        ) : (
          <img
            src={
              selected.adhaarAttachment.startsWith("data:")
                ? selected.adhaarAttachment
                : getFileUrl(selected.adhaarAttachment) || ""
            }
            className={styles.docPreview}
            alt="Aadhaar"
            onClick={() => openInNewTab(selected.adhaarAttachment)}
          />
        )
      ) : (
        <div className={styles.noPreview}>No Aadhaar uploaded</div>
      )}
    </div>

    <div className={styles.verifyRow}>
      <button
        className={`${styles.verifyAction} ${
          aadhaarStatus === "approved" ? styles.approved : ""
        }`}
        onClick={() => setAadhaarApproved()}
        disabled={aadhaarStatus === "approved"}
      >
        Approve 
      </button>

      <button
        className={`${styles.verifyAction} ${
          aadhaarStatus === "rejected" ? styles.reject : ""
        }`}
        onClick={() => setAadhaarRejected()}
        disabled={aadhaarStatus === "rejected"}
      >
        Reject 
      </button>

      <div
        className={`${styles.statusPill} ${
          aadhaarStatus === "approved" ? styles.pillApproved : ""
        } ${aadhaarStatus === "rejected" ? styles.pillRejected : ""}`}
      >
        {aadhaarStatus === "pending" && "Pending"}
        {aadhaarStatus === "approved" && "Approved"}
        {aadhaarStatus === "rejected" && "Rejected"}
      </div>
    </div>
  </div>


  {/* ================= AADHAAR BACK ================= */}
  <div className={styles.docCard}>
    <div className={styles.docHeader}>
      <strong>Aadhaar Backside</strong>
      <span className={styles.smallNote}>Preview & verify</span>
    </div>

    <div className={styles.docPreviewWrap}>
      {selected.adhaarBackAttachment ? (
        selected.adhaarBackAttachment.startsWith("data:application/pdf") ? (
          <object
            data={selected.adhaarBackAttachment}
            type="application/pdf"
            className={styles.docPreview}
            onClick={() => openInNewTab(selected.adhaarBackAttachment)}
          />
        ) : (
          <img
            src={
              selected.adhaarBackAttachment.startsWith("data:")
                ? selected.adhaarBackAttachment
                : getFileUrl(selected.adhaarBackAttachment) || ""
            }
            className={styles.docPreview}
            alt="Aadhaar Back"
            onClick={() => openInNewTab(selected.adhaarBackAttachment)}
          />
        )
      ) : (
        <div className={styles.noPreview}>No Aadhaar backside uploaded</div>
      )}
    </div>

    <div className={styles.verifyRow}>
      <button
        className={`${styles.verifyAction} ${
          aadhaarBackStatus === "approved" ? styles.approved : ""
        }`}
        onClick={() => setAadhaarBackStatus("approved")}
        disabled={aadhaarBackStatus === "approved"}
      >
        Approve 
      </button>

      <button
        className={`${styles.verifyAction} ${
          aadhaarBackStatus === "rejected" ? styles.reject : ""
        }`}
        onClick={() => setAadhaarBackStatus("rejected")}
        disabled={aadhaarBackStatus === "rejected"}
      >
        Reject
      </button>

      <div
        className={`${styles.statusPill} ${
          aadhaarBackStatus === "approved" ? styles.pillApproved : ""
        } ${aadhaarBackStatus === "rejected" ? styles.pillRejected : ""}`}
      >
        {aadhaarBackStatus === "pending" && "Pending"}
        {aadhaarBackStatus === "approved" && "Approved"}
        {aadhaarBackStatus === "rejected" && "Rejected"}
      </div>
    </div>
  </div>

</div>

            <div className={styles.docsRowTwo}>
              <div className={styles.docCard}>
                <div className={styles.docHeader}>
                  <strong>Educational Certificate</strong>
                  <span className={styles.smallNote}>
                    Educational Certificate Verification
                  </span>
                </div>

                <div className={styles.docPreviewWrap}>
                  {selected.tenthMarksheetAttachment ? (
                    selected.tenthMarksheetAttachment.startsWith(
                      "data:application/pdf"
                    ) ? (
                      <object
                        data={selected.tenthMarksheetAttachment}
                        type="application/pdf"
                        className={styles.docPreview}
                        onClick={() =>
                          openInNewTab(selected.tenthMarksheetAttachment)
                        }
                      />
                    ) : (
                      <img
                        src={
                          selected.tenthMarksheetAttachment.startsWith(
                            "data:"
                          )
                            ? selected.tenthMarksheetAttachment
                            : getFileUrl(
                                selected.tenthMarksheetAttachment
                              ) || ""
                        }
                        className={styles.docPreview}
                        alt="Educational Certificate"
                        onClick={() =>
                          openInNewTab(selected.tenthMarksheetAttachment)
                        }
                      />
                    )
                  ) : (
                    <div className={styles.noPreview}>
                      No educational certificate uploaded
                    </div>
                  )}
                </div>

                <div className={styles.verifyRow}>
                  <button
                    className={`${styles.verifyAction} ${
                      tenthStatus === "approved" ? styles.approved : ""
                    }`}
                    onClick={() => setTenthStatus("approved")}
                    disabled={tenthStatus === "approved"}
                  >
                    Approve
                  </button>

                  <button
                    className={`${styles.verifyAction} ${
                      tenthStatus === "rejected" ? styles.reject : ""
                    }`}
                    onClick={() => setTenthStatus("rejected")}
                    disabled={tenthStatus === "rejected"}
                  >
                    Reject
                  </button>

                  <div
                    className={`${styles.statusPill} ${
                      tenthStatus === "approved" ? styles.pillApproved : ""
                    } ${tenthStatus === "rejected" ? styles.pillRejected : ""}`}
                  >
                    {tenthStatus === "pending" && "Pending"}
                    {tenthStatus === "approved" && "Approved"}
                    {tenthStatus === "rejected" && "Rejected"}
                  </div>
                </div>
              </div>

              {/* ================= BANK DETAILS ================= */}
              <div className={styles.docCard}>
                <div className={styles.docHeader}>
                  <strong>Bank Details</strong>
                  <span className={styles.smallNote}>Cancelled Cheque Verification</span>
                </div>

                    <div className={styles.docPreviewWrap}>
                      {selected.cancelledChequeAttachment ? (
                        selected.cancelledChequeAttachment.startsWith("data:application/pdf") ? (
                          <object
                            data={selected.cancelledChequeAttachment}
                            type="application/pdf"
                            className={styles.docPreview}
                            onClick={() => openInNewTab(selected.cancelledChequeAttachment)}
                          />
                        ) : (
                          <img
                            src={
                              selected.cancelledChequeAttachment.startsWith("data:")
                                ? selected.cancelledChequeAttachment
                                : getFileUrl(selected.cancelledChequeAttachment) || ""
                            }
                            className={styles.docPreview}
                            alt="Cancelled Cheque"
                            onClick={() => openInNewTab(selected.cancelledChequeAttachment)}
                          />
                        )
                      ) : (
                        <div className={styles.noPreview}>No cancelled cheque uploaded</div>
                      )}
                    </div>

                    <div className={styles.verifyRow}>
                      <button
                        className={`${styles.verifyAction} ${
                          bankStatus === "approved" ? styles.approved : ""
                        }`}
                        onClick={() => setBankStatus("approved")}
                        disabled={!selected?.cancelledChequeAttachment || bankStatus === "approved"}
                      >
                        Approve
                      </button>

                      <button
                        className={`${styles.verifyAction} ${
                          bankStatus === "rejected" ? styles.reject : ""
                        }`}
                        onClick={() => setBankStatus("rejected")}
                        disabled={!selected?.cancelledChequeAttachment || bankStatus === "rejected"}
                      >
                        Reject
                      </button>

                      <div
                        className={`${styles.statusPill} ${
                          !selected?.cancelledChequeAttachment ? styles.disabledStatus : ""
                        } ${bankStatus === "approved" ? styles.pillApproved : ""} ${
                          bankStatus === "rejected" ? styles.pillRejected : ""
                        }`}
                      >
                        {bankStatus === "pending" && "Pending"}
                        {bankStatus === "approved" && "Approved"}
                        {bankStatus === "rejected" && "Rejected"}
                      </div>
                    </div>
              </div>
            </div>

              {/* Assign manager */}
              <div className={styles.formRow}>
     <div className={styles.formGroup}>
  <label>Assign District Manager</label>

  <Select
    options={managerList.map((m) => ({
      value: m.managerId,
      label: `${m.firstName ?? ""} ${m.lastName ?? ""} (${m.managerId})`,
    }))}
    isDisabled={!(irdaiVerified && iibVerified)}
    placeholder="Search & Select District Manager..."
    value={
      managerList
        .map((m) => ({
          value: m.managerId,
          label: `${m.firstName ?? ""} ${m.lastName ?? ""} (${m.managerId})`,
        }))
        .find((o) => o.value === assignManager) || null
    }
    onChange={(selected) => setAssignManager(selected?.value || "")}
    isSearchable
    isClearable
    classNamePrefix="react-select"
  />

</div>
                <div className={styles.formGroup}>
                  <label>IRDAI Verification</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className={styles.irdaiBtn}
                      onClick={handleIrdaiClick}
                      type="button"
                    >
                      Open IRDAI
                    </button>
                    <button
  className={styles.irdaiBtn}
  onClick={handleIibClick}
  type="button"
>
  Open IIB Verification
</button>
                    <div className={styles.irdaiStatus}>
                      {irdaiVerified && iibVerified ? "Done" : "Not Verified"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Remark (required if any reject) */}
              <div className={styles.remarkWrap}>
                <label>
                  Remark{" "}
                  {anyRejected ? <span style={{ color: "red" }}>*</span> : null}
                </label>
                <textarea
                  className={styles.remarkField}
                  placeholder="Type reason for rejection or any notes."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                {/* disabled is deliberately limited to conditions that now have
                    a real :disabled style (request in flight, or a rejected
                    document blocking approval) — everything else (pending docs,
                    missing remark) is instead explained via handleReview's own
                    alert() when clicked, so the admin always gets feedback
                    instead of a silently inert button. */}
                {/* Final decision only for applications still awaiting review */}
                {selected.status === "pending" && (
                  <>
                    <button
                      className={styles.finalRejectBtn}
                      onClick={() => handleReview("reject")}
                      disabled={rejectLoading}
                    >
                      {rejectLoading ? "Processing..." : "Reject Application"}
                    </button>

                    <button
                      className={styles.finalAcceptBtn}
                      onClick={() => handleReview("accept")}
                      disabled={approveLoading || anyRejected}
                      title={anyRejected ? "Cannot approve — a document was rejected" : undefined}
                    >
                      {approveLoading ? "Processing..." : "Approve Application"}
                    </button>
                  </>
                )}

                <button
                  className={styles.closeBtn}
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
                {editMode && (
  <button
    className={styles.finalAcceptBtn}
    onClick={handleUpdateAgent}
  >
    Save Changes
  </button>
)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
