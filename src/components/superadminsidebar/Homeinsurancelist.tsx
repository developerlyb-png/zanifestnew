"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "@/styles/components/superadminsidebar/homeinsurancelist.module.css";
import { FiDownload, FiSearch } from "react-icons/fi";

interface HomeRecord {
  _id: string;
  fullName: string;
  email: string | null;
  phoneNumber: string;
  assignedTo?: string | null;
  createdAt: string;
  [key: string]: any;
}

interface Agent {
  _id: string;
  email: string;
}

const Homeinsurancelist = () => {
  const [records, setRecords] = useState<HomeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRecord, setSelectedRecord] =
    useState<HomeRecord | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [assignFilter, setAssignFilter] = useState<"all" | "assigned" | "unassigned">("all");

  const fetchRecords = async () => {
    setLoading(true);
    const res = await axios.get("/api/homeinsurance");
    setRecords(res.data.data || []);
    setLoading(false);
  };

  const fetchAgents = async () => {
    const res = await axios.get("/api/getallagents");
    setAgents(res.data || []);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    if (selectedRecord) fetchAgents();
  }, [selectedRecord]);

  const assignLead = async () => {
    if (!selectedAgent) return alert("Please select an agent");

    await axios.post("/api/homeinsurance?assign=true", {
      recordId: selectedRecord?._id,
      agentId: selectedAgent,
    });

    alert("Lead Assigned!");
    setSelectedRecord(null);
    setSelectedAgent("");
    fetchRecords();
  };

  const filteredRecords = records
    .filter((item) =>
      assignFilter === "all"
        ? true
        : assignFilter === "assigned"
        ? !!item.assignedTo
        : !item.assignedTo
    )
    .filter((item) =>
      `${item.email || ""} ${item.phoneNumber || ""} ${item.assignedTo || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

  const exportCsv = () => {
    const headers = ["S.No", "Email", "Phone", "Assigned To"];
    const rows = filteredRecords.map((item, i) => [
      i + 1,
      item.email || "-",
      item.phoneNumber || "-",
      item.assignedTo || "Not Assigned",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "home-insurance-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Home Insurance List</h2>
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
            placeholder="Search by email, phone, or agent"
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
              <th>Email</th>
              <th>Phone</th>
              <th>Assigned To</th>
              <th>Show</th>
            </tr>
          </thead>

          <tbody>
            {filteredRecords.map((item, i) => (
              <tr
                key={item._id}
                onClick={() => setSelectedRecord(item)}
              >
                <td>{i + 1}</td>
                <td>{item.email || "-"}</td>
                <td>{item.phoneNumber}</td>
                <td>{item.assignedTo || "Not Assigned"}</td>
                <td>
                  <button
                    className={styles.showBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRecord(item);
                    }}
                  >
                    Show
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL ================= */}
      {selectedRecord && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Home Insurance Details</h3>

            <div className={styles.modalContent}>
              {Object.entries(selectedRecord).map(([k, v]) => (
                <p key={k}>
                  <strong>{k}</strong>
                  <span>{v?.toString()}</span>
                </p>
              ))}
            </div>

            <label className={styles.assignLabel}>Select Agent</label>
            <select
              className={styles.agentDropdown}
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
            >
              <option value="">Select Agent</option>
              {agents.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.email}
                </option>
              ))}
            </select>

            <div className={styles.modalFooter}>
              <button className={styles.assignBtn} onClick={assignLead}>
                Assign To Agent
              </button>
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homeinsurancelist;
