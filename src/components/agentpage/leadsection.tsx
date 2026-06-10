"use client";
import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/pages/leadsection.module.css";
import { FiSearch } from "react-icons/fi";

interface Lead {
  id: string;
  email?: string;
  phone?: string;
  module: string;
  assignedAt?: string;
  status?: string;
}

type FullDoc = { [key: string]: any };

export default function LeadSection() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔍 filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // modal state
  const [showModal, setShowModal] = useState(false);
  const [fullDoc, setFullDoc] = useState<FullDoc | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [status, setStatus] = useState("Cold");
  const [remark, setRemark] = useState("");
  const [currentLeadId, setCurrentLeadId] = useState<string | null>(null);
  // module filter
const [moduleFilter, setModuleFilter] = useState("All");

// date range
const [fromDate, setFromDate] = useState("");
const [toDate, setToDate] = useState("");

// pagination
const [currentPage, setCurrentPage] = useState(1);
const ITEMS_PER_PAGE = 10;

const MODULES = [
  "MarineModuleRequest",
  "TravelInsurance",
  "HomeInsurance",
  "OfficePackagePolicy",
];


  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const res = await fetch(`/api/agent/leads`);
    const json = await res.json();
    if (json.success) setLeads(json.data || []);
    setLoading(false);
  };

  // ✅ FILTERED DATA
 const filteredLeads = useMemo(() => {
  return leads.filter((l) => {
    // status
    const statusMatch =
      statusFilter === "All" ||
      (l.status || "Cold").toLowerCase() === statusFilter.toLowerCase();

    // module
    const moduleMatch =
      moduleFilter === "All" || l.module === moduleFilter;

    // search
    const searchText = search.toLowerCase();
    const searchMatch =
      !search ||
      l.email?.toLowerCase().includes(searchText) ||
      l.phone?.toLowerCase().includes(searchText) ||
      l.module.toLowerCase().includes(searchText);

    // date range
    const assigned = l.assignedAt ? new Date(l.assignedAt) : null;
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    const dateMatch =
      (!from || (assigned && assigned >= from)) &&
      (!to || (assigned && assigned <= to));

    return statusMatch && moduleMatch && searchMatch && dateMatch;
  });
}, [leads, statusFilter, moduleFilter, search, fromDate, toDate]);

// ✅ PAGINATION (HOOKS MUST BE HERE)

const paginatedLeads = useMemo(() => {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  return filteredLeads.slice(start, start + ITEMS_PER_PAGE);
}, [filteredLeads, currentPage]);

  const openLeadDetails = async (moduleName: string, id: string) => {
    setModalError(null);
    setModalLoading(true);
    setShowModal(true);
    setFullDoc(null);
    setCurrentLeadId(id);

    try {
      const params = new URLSearchParams({ module: moduleName, id });
      const res = await fetch(`/api/agent/leadDetails?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setModalError(json.message || "Failed to fetch lead details");
      } else {
        setFullDoc(json.data || null);
        setStatus(json.data?.status || "Cold");
        setRemark(json.data?.remark || "");
      }
    } catch (err: any) {
      setModalError(err.message || "Failed to fetch lead details");
    } finally {
      setModalLoading(false);
    }
  };

  const saveStatusRemark = async () => {
    if (!currentLeadId) return;

    const res = await fetch("/api/agent/updateLeadStatus", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: currentLeadId, status, remark }),
    });

    const json = await res.json();
    if (json.success) {
      alert("Lead updated successfully");
      setShowModal(false);
      fetchLeads();
    } else {
      alert(json.message || "Failed to update lead");
    }
  };

const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);



  return (
    <div className={styles.container}>
      <h2 className={styles.title}>All Leads</h2>

      {/* 🔍 FILTER BAR */}
     <div className={styles.filterBar}>
  {/* MODULE DROPDOWN */}
  <select
    value={moduleFilter}
    onChange={(e) => {
      setModuleFilter(e.target.value);
      setCurrentPage(1);
    }}
  >
    <option value="All">All Modules</option>
    {MODULES.map((m) => (
      <option key={m} value={m}>
        {m}
      </option>
    ))}
  </select>

  {/* STATUS DROPDOWN (existing) */}
  <select
    value={statusFilter}
    onChange={(e) => {
      setStatusFilter(e.target.value);
      setCurrentPage(1);
    }}
  >
    <option value="All">All Status</option>
    <option value="Cold">Cold</option>
    <option value="Hot">Hot</option>
    <option value="interested">Interested</option>
    <option value="Closed">Closed</option>
    <option value="not interested">Not Interested</option>
  </select>

 {/* FROM DATE */}
<input
  type="date"
  className={styles.dateInput}
  value={fromDate}
  onChange={(e) => {
    setFromDate(e.target.value);
    setCurrentPage(1);
  }}
/>

{/* TO DATE */}
<input
  type="date"
  className={styles.dateInput}
  value={toDate}
  onChange={(e) => {
    setToDate(e.target.value);
    setCurrentPage(1);
  }}
/>


  {/* SEARCH (existing) */}
  <div className={styles.searchBox}>
    <FiSearch className={styles.searchIcon} />
    <input
      type="text"
      placeholder="Search...."
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setCurrentPage(1);
      }}
    />
  </div>
</div>


      {/* TABLE */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Phone</th>
              <th>Module</th>
              <th>Status</th>
              <th>Assigned At</th>
              <th>Show Data</th>
            </tr>
          </thead>

          <tbody>
{paginatedLeads.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.empty}>
                  No matching leads found
                </td>
              </tr>
            )}

{paginatedLeads.map((l) => (
              <tr key={l.id}>
                <td>{l.email || "-"}</td>
                <td>{l.phone || "-"}</td>
                <td>{l.module}</td>
                <td>{l.status || "Cold"}</td>
                <td>
                  {l.assignedAt
                    ? new Date(l.assignedAt).toLocaleString()
                    : "-"}
                </td>
                <td>
                  <button
                    className={styles.showBtn}
                    onClick={() => openLeadDetails(l.module, l.id)}
                  >
                    Show Data
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
   
</div>
     <div className={styles.pagination}>
  <button
    disabled={currentPage === 1}
    onClick={() => setCurrentPage(p => p - 1)}
  >
    Prev
  </button>

  <span>
    Page {currentPage} of {totalPages || 1}
  </span>

  <button
    disabled={currentPage === totalPages}
    onClick={() => setCurrentPage(p => p + 1)}
  >
    Next
  </button>

      </div>

      {/* MODAL (same as before) */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Lead Details</h3>
              <button
                className={styles.closeBtn}
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>

            {modalLoading && <div>Loading...</div>}
            {modalError && <div>{modalError}</div>}

            {!modalLoading && fullDoc && (
              <>
                <div className={styles.modalContent}>
                  {Object.entries(fullDoc).map(([k, v]) => (
                    <div key={k} className={styles.field}>
                      <label>{k}</label>
                      <div className={styles.valueBox}>{renderValue(v)}</div>
                    </div>
                  ))}
                </div>

                <div className={styles.modalFooter}>
                  <div className={styles.statusBox}>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="Cold">Cold</option>
                      <option value="Hot">Hot</option>
                      <option value="Closed">Closed</option>
                      <option value="interested">Interested</option>
                      <option value="not interested">Not Interested</option>
                    </select>

                    <textarea
                      rows={3}
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="Remark"
                    />
                  </div>

                  <button className={styles.saveBtn} onClick={saveStatusRemark}>
                    Save
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function renderValue(value: any) {
  if (!value) return "-";
  if (typeof value === "object") return <pre>{JSON.stringify(value, null, 2)}</pre>;
  return String(value);
}
