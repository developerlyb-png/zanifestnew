"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FiDownload,
  FiSearch,
  FiColumns,
  FiPlus,
  FiUploadCloud,
  FiUsers,
  FiGlobe,
  FiLock,
  FiCheckCircle,
  FiEye,
  FiEdit2,
  FiMail,
  FiPhone,
} from "react-icons/fi";
import styles from "@/styles/components/superadminsidebar/PolicyDashboard.module.css";
import cm from "@/styles/components/superadminsidebar/ClientManagement.module.css";
import ClientForm from "./ClientForm";
import ClientDetailView from "./ClientDetailView";

interface ClientRow {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  kycDocumentType?: string;
  kycFiles?: { data: string; fileName: string }[];
  notifyWhatsapp?: boolean;
  notifyEmail?: boolean;
  isGlobal?: boolean;
  isActive?: boolean;
  subClients?: { name: string; phone: string; email: string }[];
}

type ColumnKey = "name" | "contact" | "kyc" | "subInsureds" | "notifications" | "type" | "status";

const COLUMNS: { key: ColumnKey; label: string; defaultOn: boolean }[] = [
  { key: "name", label: "Name", defaultOn: true },
  { key: "contact", label: "Contact Info", defaultOn: true },
  { key: "kyc", label: "KYC Documents", defaultOn: true },
  { key: "subInsureds", label: "Sub Insureds", defaultOn: true },
  { key: "notifications", label: "Notifications", defaultOn: true },
  { key: "type", label: "Client Type", defaultOn: true },
  { key: "status", label: "Status", defaultOn: true },
];

const DEFAULT_VISIBLE = COLUMNS.reduce((acc, c) => {
  acc[c.key] = c.defaultOn;
  return acc;
}, {} as Record<ColumnKey, boolean>);

function avatarInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function avatarToneIndex(name: string) {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return sum % 6;
}
const AVATAR_TONE_CLASSES = [cm.avatarTone0, cm.avatarTone1, cm.avatarTone2, cm.avatarTone3, cm.avatarTone4, cm.avatarTone5];

export default function ClientManagement() {
  const [view, setView] = useState<"list" | "add" | "edit" | "detail">("list");
  const [activeId, setActiveId] = useState<string | null>(null);

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [nameSearch, setNameSearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowColumnPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (view !== "list") return;
    setLoading(true);
    fetch("/api/admin/clients", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setClients(d.clients || []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, [refreshKey, view]);

  const filtered = useMemo(
    () =>
      clients.filter((c) => {
        if (nameSearch && !c.name?.toLowerCase().includes(nameSearch.toLowerCase())) return false;
        if (
          contactSearch &&
          !c.email?.toLowerCase().includes(contactSearch.toLowerCase()) &&
          !c.phone?.toLowerCase().includes(contactSearch.toLowerCase())
        )
          return false;
        if (typeFilter === "global" && !c.isGlobal) return false;
        if (typeFilter === "private" && c.isGlobal) return false;
        if (statusFilter === "active" && c.isActive === false) return false;
        if (statusFilter === "inactive" && c.isActive !== false) return false;
        return true;
      }),
    [clients, nameSearch, contactSearch, typeFilter, statusFilter]
  );

  const visible = filtered.slice(0, rowsPerPage);
  const visibleCount = COLUMNS.filter((c) => visibleColumns[c.key]).length;

  const counts = useMemo(() => {
    const total = clients.length;
    const global = clients.filter((c) => c.isGlobal).length;
    const active = clients.filter((c) => c.isActive !== false).length;
    return { total, global, private: total - global, active };
  }, [clients]);

  const toggleStatus = async (client: ClientRow) => {
    if (client._id.startsWith("policy-")) {
      toast.error("Save this client first via Add Client before changing its status.");
      return;
    }
    const next = !(client.isActive !== false);
    setClients((prev) => prev.map((c) => (c._id === client._id ? { ...c, isActive: next } : c)));
    setTogglingId(client._id);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: client._id, isActive: next }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
      setClients((prev) => prev.map((c) => (c._id === client._id ? { ...c, isActive: !next } : c)));
    } finally {
      setTogglingId(null);
    }
  };

  const exportCsv = () => {
    const rows = filtered.map((c) => [
      c.name,
      c.email,
      c.phone,
      c.address || "",
      (c.kycFiles || []).length,
      (c.subClients || []).length,
      c.isGlobal ? "Global" : "Private",
      c.isActive !== false ? "Active" : "Inactive",
    ]);
    const csvText = [
      ["Name", "Email", "Phone", "Address", "KYC Files", "Sub Insureds", "Client Type", "Status"],
      ...rows,
    ]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csvText], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (view === "add") {
    return (
      <div className={`${styles.cont} ${cm.clientManagementPage}`}>
        <ClientForm
          onCancel={() => setView("list")}
          onSaved={(id) => {
            setView("detail");
            setActiveId(id);
            setRefreshKey((k) => k + 1);
          }}
        />
      </div>
    );
  }

  if (view === "edit" && activeId) {
    return (
      <div className={`${styles.cont} ${cm.clientManagementPage}`}>
        <ClientForm
          editId={activeId}
          onCancel={() => setView("detail")}
          onSaved={(id) => {
            setActiveId(id);
            setView("detail");
            setRefreshKey((k) => k + 1);
          }}
        />
      </div>
    );
  }

  if (view === "detail" && activeId) {
    return (
      <div className={`${styles.cont} ${cm.clientManagementPage}`}>
        <ClientDetailView
          clientId={activeId}
          onBack={() => {
            setView("list");
            setRefreshKey((k) => k + 1);
          }}
          onEdit={() => setView("edit")}
        />
      </div>
    );
  }

  return (
    <div className={`${styles.cont} ${cm.clientManagementPage}`}>
      <div className={styles.headerRow}>
        <h2 className={`${styles.heading} ${cm.clientPageHeading}`}>Client Management</h2>
        <div className={styles.headerActions}>
          <button className={styles.outlineBtn} onClick={() => toast("Bulk upload is coming soon.")}>
            <FiUploadCloud /> Bulk Upload
          </button>
          <button className={`${styles.primaryBtn} ${cm.clientAddButton}`} onClick={() => setView("add")}>
            <FiPlus /> Add Client
          </button>
        </div>
      </div>

      <div className={cm.statChipRow}>
        <div className={`${cm.statChip} ${cm.toneBlue}`}>
          <span className={`${cm.statChipIcon} ${cm.toneBlue}`}>
            <FiUsers />
          </span>
          <div>
            <div className={cm.statChipValue}>{counts.total}</div>
            <div className={cm.statChipLabel}>Total Clients</div>
          </div>
        </div>
        <div className={`${cm.statChip} ${cm.toneGreen}`}>
          <span className={`${cm.statChipIcon} ${cm.toneGreen}`}>
            <FiCheckCircle />
          </span>
          <div>
            <div className={cm.statChipValue}>{counts.active}</div>
            <div className={cm.statChipLabel}>Active</div>
          </div>
        </div>
        <div className={`${cm.statChip} ${cm.toneAmber}`}>
          <span className={`${cm.statChipIcon} ${cm.toneAmber}`}>
            <FiGlobe />
          </span>
          <div>
            <div className={cm.statChipValue}>{counts.global}</div>
            <div className={cm.statChipLabel}>Global</div>
          </div>
        </div>
        <div className={`${cm.statChip} ${cm.toneSlate}`}>
          <span className={`${cm.statChipIcon} ${cm.toneSlate}`}>
            <FiLock />
          </span>
          <div>
            <div className={cm.statChipValue}>{counts.private}</div>
            <div className={cm.statChipLabel}>Private</div>
          </div>
        </div>
      </div>

      <div className={`${styles.filterRow} ${cm.clientFilters}`}>
        <div />
        <div className={`${styles.filterRowRight} ${cm.clientFilterActions}`}>
          <button className={`${styles.exportSolidBtn} ${cm.clientExportButton}`} onClick={exportCsv}>
            <FiDownload /> Export
          </button>
          <div className={`${styles.columnPickerWrapper} ${cm.clientColumnPicker}`} ref={pickerRef}>
            <button className={`${styles.outlineBtn} ${cm.clientColumnButton}`} onClick={() => setShowColumnPicker((v) => !v)}>
              <FiColumns /> Filter Columns
            </button>
            {showColumnPicker && (
              <div className={`${styles.columnPickerDropdown} ${cm.clientColumnDropdown}`}>
                {COLUMNS.map((c) => (
                  <label key={c.key} className={`${styles.columnPickerItem} ${cm.clientColumnItem}`}>
                    <input
                      type="checkbox"
                      checked={visibleColumns[c.key]}
                      onChange={() => setVisibleColumns((p) => ({ ...p, [c.key]: !p[c.key] }))}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px" }}>
        {filtered.length} of {clients.length} clients
      </p>

      <div className={`${styles.tableWrapper} ${cm.clientTableWrapper}`}>
        <table className={`${styles.table} ${cm.clientTable}`} style={{ minWidth: 1100 }}>
          <thead>
            <tr>
              {COLUMNS.filter((c) => visibleColumns[c.key]).map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              <th>Actions</th>
            </tr>
            <tr className={styles.filterHeaderRow}>
              {visibleColumns.name && (
                <td>
                  <div className={styles.searchInput}>
                    <FiSearch size={12} />
                    <input placeholder="Search by name" value={nameSearch} onChange={(e) => setNameSearch(e.target.value)} />
                  </div>
                </td>
              )}
              {visibleColumns.contact && (
                <td>
                  <div className={styles.searchInput}>
                    <FiSearch size={12} />
                    <input
                      placeholder="Search by email or phone"
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                    />
                  </div>
                </td>
              )}
              {visibleColumns.kyc && <td className={styles.dashCell}>—</td>}
              {visibleColumns.subInsureds && <td className={styles.dashCell}>—</td>}
              {visibleColumns.notifications && <td className={styles.dashCell}>—</td>}
              {visibleColumns.type && (
                <td>
                  <select className={cm.pillSelect} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="">All</option>
                    <option value="global">Global</option>
                    <option value="private">Private</option>
                  </select>
                </td>
              )}
              {visibleColumns.status && (
                <td>
                  <select className={cm.pillSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
              )}
              <td className={styles.dashCell}>—</td>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleCount + 1} className={styles.emptyCell}>
                  Loading clients...
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={visibleCount + 1} className={styles.emptyCell}>
                  No clients found.
                </td>
              </tr>
            ) : (
              visible.map((c) => {
                const kycCount = (c.kycFiles || []).length;
                const subCount = (c.subClients || []).length;
                const isVirtual = c._id.startsWith("policy-");
                return (
                  <tr key={c._id}>
                    {visibleColumns.name && (
                      <td>
                        <div className={cm.avatarRow}>
                          <span className={`${cm.avatar} ${AVATAR_TONE_CLASSES[avatarToneIndex(c.name || "?")]}`}>
                            {avatarInitials(c.name || "?")}
                          </span>
                          <button
                            type="button"
                            className={cm.nameLink}
                            onClick={() => {
                              setActiveId(c._id);
                              setView("detail");
                            }}
                          >
                            {c.name}
                          </button>
                        </div>
                      </td>
                    )}
                    {visibleColumns.contact && (
                      <td>
                        <div className={cm.contactLine}>
                          <span className={cm.contactLabel}>Email:</span> {c.email || "—"}
                        </div>
                        <div className={cm.contactLine}>
                          <span className={cm.contactLabel}>Phone:</span> {c.phone || "—"}
                        </div>
                      </td>
                    )}
                    {visibleColumns.kyc && (
                      <td>
                        <span className={cm.kycText}>
                          {kycCount > 0 ? <span className={cm.kycCount}>{kycCount} file(s)</span> : "No KYC files uploaded"}
                        </span>
                      </td>
                    )}
                    {visibleColumns.subInsureds && (
                      <td>
                        <span className={`${cm.subBadge} ${subCount > 0 ? cm.subBadgeSome : cm.subBadgeZero}`}>{subCount}</span>
                      </td>
                    )}
                    {visibleColumns.notifications && (
                      <td>
                        <div className={cm.notifyDots}>
                          <span
                            className={`${cm.notifyDot} ${c.notifyEmail ? cm.notifyDotOn : cm.notifyDotOff}`}
                            title={`Email notifications ${c.notifyEmail ? "enabled" : "disabled"}`}
                          >
                            <FiMail size={12} />
                          </span>
                          <span
                            className={`${cm.notifyDot} ${c.notifyWhatsapp ? cm.notifyDotOn : cm.notifyDotOff}`}
                            title={`WhatsApp notifications ${c.notifyWhatsapp ? "enabled" : "disabled"}`}
                          >
                            <FiPhone size={12} />
                          </span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.type && (
                      <td>
                        <span className={`${cm.pill} ${c.isGlobal ? cm.pillGlobal : cm.pillPrivate}`}>
                          {c.isGlobal ? "Global" : "Private"}
                        </span>
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td>
                        <label className={cm.toggle}>
                          <input
                            type="checkbox"
                            checked={c.isActive !== false}
                            disabled={togglingId === c._id || isVirtual}
                            onChange={() => toggleStatus(c)}
                          />
                          <span className={cm.toggleSlider} />
                        </label>
                      </td>
                    )}
                    <td>
                      <div className={cm.rowActions}>
                        <button
                          type="button"
                          className={cm.iconActionBtn}
                          title="View"
                          onClick={() => {
                            setActiveId(c._id);
                            setView("detail");
                          }}
                        >
                          <FiEye size={14} />
                        </button>
                        <button
                          type="button"
                          className={cm.iconActionBtn}
                          title={isVirtual ? "Save this client first via Add Client" : "Edit"}
                          disabled={isVirtual}
                          onClick={() => {
                            setActiveId(c._id);
                            setView("edit");
                          }}
                        >
                          <FiEdit2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className={styles.tableFooter}>
          <span>Rows per page:</span>
          <select className={styles.rowsPerPageSelect} value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
