"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "@/styles/components/superadminsidebar/homeinsurancelist.module.css";

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

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Home Insurance List</h2>

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
            {records.map((item, i) => (
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
