"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import styles from "@/styles/components/superadminsidebar/pospmanagement.module.css";
import sharedStyles from "@/styles/components/superadminsidebar/sharedTable.module.css";
import AgentDetailView from "./AgentDetailView";
import CreateAgent from "./createagent";
import { FiSearch, FiDownload, FiColumns, FiExternalLink, FiPlus, FiX, FiTrash2, FiEdit2 } from "react-icons/fi";
import { Modal, Input } from "antd";
import { toast } from "react-hot-toast";

interface PospRow {
  _id: string;
  agentCode: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  kycStatus: string;
  trainingCompleted: boolean;
  assessmentCompleted: boolean;
  assignedTo: string;
  accountStatus: "active" | "inactive";
  lifetimeSales: number;
}

// "reviewed" is the status an admin's "accept" action actually sets on an
// agent (see reviewAgent.ts) — it reads to the admin as "Approved" the same
// way the approval email already calls it, so both statuses map to the same
// pill here rather than showing an internal-only status name.
const kycLabel = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s === "rejected") return "REJECTED";
  if (s === "pending") return "PENDING";
  return "APPROVED";
};

const kycTone = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s === "rejected") return styles.pillRed;
  if (s === "pending") return styles.pillYellow;
  return styles.pillGreen;
};

// Government/IIB public lookup tools an admin cross-checks a POSP against —
// not part of our data, just quick links out.
const EXTERNAL_LINKS = [
  { label: "POSP Locator", href: "https://pos.iib.gov.in/" },
  { label: "IRDAI Agent Locator", href: "https://agencyportal.irdai.gov.in/PublicAccess/AgentLocator.aspx" },
  { label: "IRDAI PAN Lookup", href: "https://agencyportal.irdai.gov.in/PublicAccess/LookUpPAN.aspx" },
];

type ColumnKey =
  | "agentNo"
  | "phone"
  | "pospInfo"
  | "kycStatus"
  | "trainingCompleted"
  | "assessmentCompleted"
  | "assignedTo"
  | "lifetimeSales"
  | "status"
  | "delete";

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "agentNo", label: "Agent No." },
  { key: "phone", label: "Phone" },
  { key: "pospInfo", label: "POSP Info" },
  { key: "kycStatus", label: "KYC Status" },
  { key: "trainingCompleted", label: "Training Completed" },
  { key: "assessmentCompleted", label: "Assessment Completed" },
  { key: "assignedTo", label: "Assigned To" },
  { key: "lifetimeSales", label: "Lifetime Sales" },
  { key: "status", label: "Status" },
  { key: "delete", label: "Delete" },
];

const ALL_VISIBLE: Record<ColumnKey, boolean> = COLUMNS.reduce((acc, c) => {
  acc[c.key] = true;
  return acc;
}, {} as Record<ColumnKey, boolean>);

// Explicit per-column widths (table uses table-layout: fixed) — without
// these the browser auto-sizes each column from its content, which is
// why "Search phone" was rendering clipped to "Search phor" and the
// KYC/Training/Assessment "Select" boxes were all different widths.
const COLUMN_WIDTHS: Record<ColumnKey, number> = {
  agentNo: 110,
  phone: 170,
  pospInfo: 300,
  kycStatus: 150,
  trainingCompleted: 170,
  assessmentCompleted: 180,
  assignedTo: 170,
  lifetimeSales: 150,
  status: 90,
  delete: 90,
};

export default function PospManagement() {
  const [rows, setRows] = useState<PospRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<PospRow | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [phoneSearch, setPhoneSearch] = useState("");
  const [infoSearch, setInfoSearch] = useState("");
  const [kycFilter, setKycFilter] = useState("");
  const [trainingFilter, setTrainingFilter] = useState("");
  const [assessmentFilter, setAssessmentFilter] = useState("");

  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(ALL_VISIBLE);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const columnPickerRef = useRef<HTMLDivElement>(null);

  // -------------------- Ported from agentlist.tsx: status toggle --------------------
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [pendingAction, setPendingAction] = useState<{ id: string; currentStatus: string } | null>(null);

  // -------------------- Ported from agentlist.tsx: assign manager --------------------
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedAgentIdForAssign, setSelectedAgentIdForAssign] = useState<string | null>(null);
  const [newAssignedTo, setNewAssignedTo] = useState<string>("");
  const [districtManagers, setDistrictManagers] = useState<any[]>([]);

  const fetchAgents = () => {
    setLoading(true);
    axios
      .get("/api/admin/posp-management")
      .then((res) => setRows(res.data?.agents || []))
      .catch((err) => console.error("Failed to load POSP partners", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    axios
      .get("/api/managers/district")
      .then((res) => {
        if (res.data?.success) setDistrictManagers(res.data.managers || []);
      })
      .catch((err) => console.error("Failed to load district managers", err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (columnPickerRef.current && !columnPickerRef.current.contains(e.target as Node)) {
        setShowColumnPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleColumn = (key: ColumnKey) =>
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));

  // -------------------- Status Toggle --------------------
  const handleToggleStatus = (id: string, currentStatus: string) => {
    setPendingAction({ id, currentStatus });
    setPasswordModalVisible(true);
  };

  const confirmToggleStatus = async () => {
    if (!passwordInput) {
      toast.error("Please enter your password");
      return;
    }
    try {
      const { id, currentStatus } = pendingAction!;
      const newStatus = currentStatus === "active" ? "inactive" : "active";

      const res = await fetch(`/api/agent/updateAccountStatus?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ accountStatus: newStatus, password: passwordInput }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Agent status updated to ${newStatus}`);
        setRows((prev) =>
          prev.map((r) => (r._id === id ? { ...r, accountStatus: newStatus } : r))
        );
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating status");
    } finally {
      setPasswordModalVisible(false);
      setPasswordInput("");
      setPendingAction(null);
    }
  };

  // -------------------- Assign Manager --------------------
  const openAssignModal = (agentId: string, currentAssignedTo: string) => {
    setSelectedAgentIdForAssign(agentId);
    setNewAssignedTo(currentAssignedTo || "");
    setAssignModalVisible(true);
  };

  const confirmAssign = async () => {
    if (!selectedAgentIdForAssign) return;
    try {
      const res = await fetch(`/api/agent/${selectedAgentIdForAssign}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: newAssignedTo }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Agent assigned successfully!");
        setRows((prev) =>
          prev.map((r) =>
            r._id === selectedAgentIdForAssign ? { ...r, assignedTo: newAssignedTo } : r
          )
        );
        setAssignModalVisible(false);
        setNewAssignedTo("");
      } else {
        toast.error(data.message || "Failed to assign agent");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  // -------------------- Delete --------------------
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this POSP agent? This cannot be undone.")) return;
    try {
      const res = await axios.delete(`/api/agent/deleteagent?id=${id}`);
      if (res.status === 200) {
        toast.success("Agent deleted successfully");
        setRows((prev) => prev.filter((r) => r._id !== id));
      } else {
        toast.error("Failed to delete agent");
      }
    } catch (err) {
      console.error("Error deleting agent:", err);
      toast.error("Error deleting agent (server-side error)");
    }
  };

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (phoneSearch && !(r.phone || "").toLowerCase().includes(phoneSearch.toLowerCase())) {
        return false;
      }
      if (infoSearch) {
        const q = infoSearch.toLowerCase();
        if (!(r.name || "").toLowerCase().includes(q) && !(r.email || "").toLowerCase().includes(q)) {
          return false;
        }
      }
      if (kycFilter && (r.kycStatus || "pending").toLowerCase() !== kycFilter) return false;
      if (trainingFilter && String(r.trainingCompleted) !== trainingFilter) return false;
      if (assessmentFilter && String(r.assessmentCompleted) !== assessmentFilter) return false;
      return true;
    });
  }, [rows, phoneSearch, infoSearch, kycFilter, trainingFilter, assessmentFilter]);

  const exportCsv = () => {
    const visible = COLUMNS.filter((c) => visibleColumns[c.key] && c.key !== "delete");
    const headers = visible.map((c) => c.label);
    const rowsOut = filtered.map((r) => {
      const cellFor: Record<string, string> = {
        agentNo: r.agentCode || "",
        phone: r.phone || "",
        pospInfo: `${r.name || ""} | ${r.email || ""} | ${r.address || ""}`,
        kycStatus: kycLabel(r.kycStatus),
        trainingCompleted: r.trainingCompleted ? "Yes" : "No",
        assessmentCompleted: r.assessmentCompleted ? "Yes" : "No",
        assignedTo: r.assignedTo || "Not Assigned",
        lifetimeSales: String(r.lifetimeSales || 0),
        status: r.accountStatus,
      };
      return visible.map((c) => cellFor[c.key]);
    });
    const csv = [headers, ...rowsOut]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "posp_partners.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const visibleColumnCount = COLUMNS.filter((c) => visibleColumns[c.key]).length;

  if (selectedAgent) {
    return (
      <div className={styles.container}>
        <AgentDetailView
          agentId={selectedAgent._id}
          trainingCompleted={selectedAgent.trainingCompleted}
          assessmentCompleted={selectedAgent.assessmentCompleted}
          onBack={() => setSelectedAgent(null)}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Password Modal — confirms the superadmin's own password before flipping accountStatus */}
      <Modal
        title="Confirm Password"
        open={passwordModalVisible}
        onOk={confirmToggleStatus}
        onCancel={() => {
          setPasswordModalVisible(false);
          setPasswordInput("");
          setPendingAction(null);
        }}
        okText="Confirm"
        cancelText="Cancel"
        centered
      >
        <Input.Password
          placeholder="Enter your password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
        />
      </Modal>

      {/* Assign Manager Modal */}
      <Modal
        title="Assign Manager"
        open={assignModalVisible}
        onOk={confirmAssign}
        onCancel={() => setAssignModalVisible(false)}
        okText="Save"
        cancelText="Cancel"
        centered
      >
        <select
          className={styles.selectInput}
          value={newAssignedTo}
          onChange={(e) => setNewAssignedTo(e.target.value)}
          style={{ width: "100%" }}
        >
          <option value="">Select Manager</option>
          {districtManagers.map((manager) => (
            <option key={manager._id} value={manager.managerId}>
              {manager.firstName}-{manager.managerId}
            </option>
          ))}
        </select>
      </Modal>

      <div className={styles.headerRow}>
        <h1 className={styles.heading}>POSP Management</h1>
        <div className={styles.externalLinks}>
          {EXTERNAL_LINKS.map((link) => (
            <a
              key={link.label}
              className={styles.externalLinkBtn}
              href={link.href}
              target="_blank"
              rel="noreferrer"
            >
              {link.label} <FiExternalLink size={12} />
            </a>
          ))}
        </div>
      </div>

      <div className={styles.actionsRow}>
        <div className={styles.actionsRowRight}>
          <button type="button" className={styles.addAgentBtn} onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? <FiX size={14} /> : <FiPlus size={14} />} {showCreate ? "Close" : "Add Agent"}
          </button>
          <button type="button" className={styles.exportBtn} onClick={exportCsv}>
            <FiDownload size={16} /> Export
          </button>
          <div className={styles.columnPickerWrapper} ref={columnPickerRef}>
            <button
              type="button"
              className={styles.outlineBtn}
              onClick={() => setShowColumnPicker((v) => !v)}
            >
              <FiColumns size={14} /> Filter Columns
            </button>
            {showColumnPicker && (
              <div className={styles.columnPickerDropdown}>
                {COLUMNS.map((c) => (
                  <label key={c.key} className={styles.columnPickerItem}>
                    <input
                      type="checkbox"
                      checked={visibleColumns[c.key]}
                      onChange={() => toggleColumn(c.key)}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreate && (
        <div className={sharedStyles.createPanel}>
          <CreateAgent />
        </div>
      )}

      <p className={styles.summary}>
        Showing {filtered.length} of {rows.length} POSP Partners
      </p>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {visibleColumns.agentNo && (
                <th className={styles.th} style={{ width: COLUMN_WIDTHS.agentNo }}>
                  <div className={styles.thLabel}>Agent No.</div>
                </th>
              )}
              {visibleColumns.phone && (
                <th className={styles.th} style={{ width: COLUMN_WIDTHS.phone }}>
                  <div className={styles.thLabel}>Phone</div>
                  <div className={styles.searchBox}>
                    <FiSearch size={13} className={styles.searchIcon} />
                    <input
                      className={styles.searchInput}
                      placeholder="Search phone"
                      value={phoneSearch}
                      onChange={(e) => setPhoneSearch(e.target.value)}
                    />
                  </div>
                </th>
              )}
              {visibleColumns.pospInfo && (
                <th className={styles.th} style={{ width: COLUMN_WIDTHS.pospInfo }}>
                  <div className={styles.thLabel}>POSP Info</div>
                  <div className={styles.searchBox}>
                    <FiSearch size={13} className={styles.searchIcon} />
                    <input
                      className={styles.searchInput}
                      placeholder="Search email / name"
                      value={infoSearch}
                      onChange={(e) => setInfoSearch(e.target.value)}
                    />
                  </div>
                </th>
              )}
              {visibleColumns.kycStatus && (
                <th className={styles.th} style={{ width: COLUMN_WIDTHS.kycStatus }}>
                  <div className={styles.thLabel}>KYC Status</div>
                  <select
                    className={styles.selectInput}
                    value={kycFilter}
                    onChange={(e) => setKycFilter(e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </th>
              )}
              {visibleColumns.trainingCompleted && (
                <th className={styles.th} style={{ width: COLUMN_WIDTHS.trainingCompleted }}>
                  <div className={styles.thLabel}>Training Completed</div>
                  <select
                    className={styles.selectInput}
                    value={trainingFilter}
                    onChange={(e) => setTrainingFilter(e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </th>
              )}
              {visibleColumns.assessmentCompleted && (
                <th className={styles.th} style={{ width: COLUMN_WIDTHS.assessmentCompleted }}>
                  <div className={styles.thLabel}>Assessment Completed</div>
                  <select
                    className={styles.selectInput}
                    value={assessmentFilter}
                    onChange={(e) => setAssessmentFilter(e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </th>
              )}
              {visibleColumns.assignedTo && (
                <th className={styles.th} style={{ width: COLUMN_WIDTHS.assignedTo }}>
                  <div className={styles.thLabel}>Assigned To</div>
                </th>
              )}
              {visibleColumns.lifetimeSales && (
                <th className={styles.th} style={{ width: COLUMN_WIDTHS.lifetimeSales }}>
                  <div className={styles.thLabel}>Lifetime Sales</div>
                </th>
              )}
              {visibleColumns.status && (
                <th className={styles.th} style={{ width: COLUMN_WIDTHS.status }}>
                  <div className={styles.thLabel}>Status</div>
                </th>
              )}
              {visibleColumns.delete && (
                <th className={styles.th} style={{ width: COLUMN_WIDTHS.delete }}>
                  <div className={styles.thLabel}>Delete</div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className={styles.emptyCell} colSpan={visibleColumnCount}>
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className={styles.emptyCell} colSpan={visibleColumnCount}>
                  No POSP partners found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r._id} className={styles.row}>
                  {visibleColumns.agentNo && (
                    <td className={styles.td}>
                      <button
                        type="button"
                        className={styles.agentCodeLink}
                        onClick={() => setSelectedAgent(r)}
                      >
                        {r.agentCode || "—"}
                      </button>
                    </td>
                  )}
                  {visibleColumns.phone && (
                    <td className={styles.td}>
                      <span className={styles.phone}>{r.phone || "—"}</span>
                    </td>
                  )}
                  {visibleColumns.pospInfo && (
                    <td className={styles.td}>
                      <div className={styles.infoLine}>
                        <b>Name:</b> {r.name || "—"}
                      </div>
                      <div className={styles.infoLine}>
                        <b>Email:</b> {r.email || "—"}
                      </div>
                      <div className={styles.infoLine}>
                        <b>Address:</b> {r.address || "—"}
                      </div>
                    </td>
                  )}
                  {visibleColumns.kycStatus && (
                    <td className={styles.td}>
                      <span className={`${styles.pill} ${kycTone(r.kycStatus)}`}>
                        {kycLabel(r.kycStatus)}
                      </span>
                    </td>
                  )}
                  {visibleColumns.trainingCompleted && (
                    <td className={styles.td}>
                      <span
                        className={`${styles.pill} ${r.trainingCompleted ? styles.pillGreen : styles.pillGray}`}
                      >
                        {r.trainingCompleted ? "Yes" : "No"}
                      </span>
                    </td>
                  )}
                  {visibleColumns.assessmentCompleted && (
                    <td className={styles.td}>
                      <span
                        className={`${styles.pill} ${r.assessmentCompleted ? styles.pillGreen : styles.pillGray}`}
                      >
                        {r.assessmentCompleted ? "Yes" : "No"}
                      </span>
                    </td>
                  )}
                  {visibleColumns.assignedTo && (
                    <td className={styles.td}>
                      <div className={styles.assignedToWrapper}>
                        <span>{r.assignedTo || "Not Assigned"}</span>
                        <button
                          type="button"
                          className={styles.editIconBtn}
                          onClick={() => openAssignModal(r._id, r.assignedTo)}
                        >
                          <FiEdit2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                  {visibleColumns.lifetimeSales && (
                    <td className={styles.td}>₹{(r.lifetimeSales || 0).toLocaleString("en-IN")}</td>
                  )}
                  {visibleColumns.status && (
                    <td className={styles.td}>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={r.accountStatus === "active"}
                          onChange={() => handleToggleStatus(r._id, r.accountStatus || "inactive")}
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </td>
                  )}
                  {visibleColumns.delete && (
                    <td className={styles.td}>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(r._id)}
                        title="Delete agent"
                        aria-label="Delete agent"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
