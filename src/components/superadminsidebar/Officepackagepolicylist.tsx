"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "@/styles/components/superadminsidebar/officepackagepolicy.module.css";

interface OfficeRecord {
  _id: string;
  companyName: string;
  email?: string | null;
  mobile: string;
  pincode?: string;
  firstTimeBuying?: string;
  lossHistory?: string;
  createdAt: string;

  assignedAgent?: string | null;
  assignedTo?: string | null;
  assignedAt?: string | null;

  [key: string]: any;
}

interface Agent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function Officepackagepolicylist() {
  const [records, setRecords] = useState<OfficeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRecord, setSelectedRecord] =
    useState<OfficeRecord | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("");

  const fetchRecords = async () => {
    setLoading(true);
    const res = await axios.get("/api/officepackagepolicyinsurance");
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

  const handleAssign = async () => {
    if (!selectedAgent) return alert("Please select an agent");

    await axios.post("/api/officepackagepolicyinsurance?assign=true", {
      policyId: selectedRecord?._id,
      agentId: selectedAgent,
    });

    alert("Lead assigned successfully!");
    setSelectedRecord(null);
    setSelectedAgent("");
    fetchRecords();
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Office Package Policy List</h2>

      {/* ================= TABLE ================= */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Email</th>
              <th>Company</th>
              <th>Mobile</th>
              <th>Assigned To</th>
              <th>Show</th>
            </tr>
          </thead>

          <tbody>
            {records.map((r, i) => (
              <tr
                key={r._id}
                onClick={() => setSelectedRecord(r)}
              >
                <td>{i + 1}</td>
                <td>{r.email || "-"}</td>
                <td>{r.companyName}</td>
                <td>{r.mobile}</td>
                <td>{r.assignedTo || "Not Assigned"}</td>

                <td>
                  <button
                    className={styles.showBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRecord(r);
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
            <h3>Office Package Policy Details</h3>

            <div className={styles.modalContent}>
              {Object.entries(selectedRecord).map(([k, v]) => (
                <p key={k}>
                  <strong>{k}</strong>
                  <span>
                    {typeof v === "object"
                      ? JSON.stringify(v)
                      : v?.toString()}
                  </span>
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
                  {a.firstName} {a.lastName} ({a.email})
                </option>
              ))}
            </select>

            <div className={styles.modalFooter}>
              <button className={styles.assignBtn} onClick={handleAssign}>
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
}
