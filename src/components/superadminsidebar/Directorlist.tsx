"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "@/styles/components/superadminsidebar/directorlist.module.css";
import { FiDownload, FiSearch } from "react-icons/fi";

export default function DirectorList() {
  const [records, setRecords] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [assignedAgent, setAssignedAgent] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [assignFilter, setAssignFilter] = useState<"all" | "assigned" | "unassigned">("all");

  useEffect(() => {
    fetchList();
  }, []);

  const fetchList = async () => {
    const res = await axios.get("/api/directorins");
    setRecords(res.data.data || []);
  };

  const fetchAgents = async () => {
    const res = await axios.get("/api/getallagents");
    setAgents(res.data || []);
  };

  useEffect(() => {
    if (selected) fetchAgents();
  }, [selected]);

  const assignAgent = async () => {
    if (!assignedAgent || !selected) return alert("Select agent");

    const agent = agents.find((a) => a._id === assignedAgent);
    const agentName =
      agent?.firstName || agent?.name
        ? `${agent.firstName ?? ""} ${agent.lastName ?? ""}`.trim()
        : agent?.email;

    await axios.put("/api/directorins", {
      directorId: selected._id,
      agentId: assignedAgent,
      agentName,
    });

    alert("Agent assigned successfully");
    setSelected(null);
    setAssignedAgent("");
    fetchList();
  };

  const filteredRecords = records
    .filter((r) =>
      assignFilter === "all"
        ? true
        : assignFilter === "assigned"
        ? !!r.assignedAgentName
        : !r.assignedAgentName
    )
    .filter((r) =>
      `${r.email || ""} ${r.mobileNumber || ""} ${r.companyName || ""} ${r.assignedAgentName || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

  const exportCsv = () => {
    const headers = ["S.No", "Mobile", "Company", "Email", "Assigned To"];
    const rows = filteredRecords.map((r, i) => [
      i + 1,
      r.mobileNumber || "-",
      r.companyName || "-",
      r.email || "Guest",
      r.assignedAgentName || "Not Assigned",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "director-officer-liability-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Director Insurance List</h2>
        <button className={styles.exportBtn} onClick={exportCsv}>
          <FiDownload size={15} /> Export CSV
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.pillGroup}>
          {[
            { key: "all", label: "All" },
            { key: "assigned", label: "Assigned" },
            { key: "unassigned", label: "Not Assigned" },
          ].map((f) => (
            <button
              key={f.key}
              className={`${styles.pill} ${assignFilter === f.key ? styles.pillActive : ""}`}
              onClick={() => setAssignFilter(f.key as "all" | "assigned" | "unassigned")}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className={styles.searchBox}>
          <FiSearch size={14} />
          <input
            placeholder="Search by mobile, company, email, or agent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Mobile</th>
              <th>Company</th>
              <th>Email</th>
              <th>Assigned</th>
              <th>Show</th>
            </tr>
          </thead>

          <tbody>
            {filteredRecords.length ? (
              filteredRecords.map((r, i) => (
 <tr key={r._id} onClick={() => setSelected(r)} style={{ cursor: "pointer" }}>
  <td>{i + 1}</td>
  <td>{r.mobileNumber}</td>
  <td>{r.companyName}</td>
  <td>{r.email || "Guest"}</td>
  <td>{r.assignedAgentName ?? "Not Assigned"}</td>
  <td>
    <button
      className={styles.showBtn}
      onClick={(e) => {
        e.stopPropagation();
        setSelected(r);
      }}
    >
      Show
    </button>
  </td>
</tr>


              ))
            ) : (
              <tr>
                <td colSpan={6} className={styles.noData}>
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL ================= */}
      {selected && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Directorlist Details</h3>

            <div className={styles.modalContent}>
              {Object.entries(selected).map(([k, v]) => (
                <div key={k}>
                  <strong>{k}</strong>
                  <span>{v === null ? "null" : String(v)}</span>
                </div>
              ))}
            </div>

            <div className={styles.agentBox}>
              <label>Select Agent</label>
              <select
                value={assignedAgent}
                onChange={(e) => setAssignedAgent(e.target.value)}
              >
                <option value="">Select Agent</option>
                {agents.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.firstName || a.name} ({a.email})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.assignBtn} onClick={assignAgent}>
                Assign To Agent
              </button>
              <button
                className={styles.closeBtn}
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
