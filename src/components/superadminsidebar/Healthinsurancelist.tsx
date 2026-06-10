"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "@/styles/components/superadminsidebar/healthinsurancelist.module.css";

interface Member {
  name: string;
  age: number;
}

interface HealthRecord {
  _id: string;
  fullName: string;
  email?: string | null;
  mobile: string;
  gender: string;
  city: string;
  members: Member[];
  assignedTo?: string | null;
  createdAt: string;
  [key: string]: any;
}

interface Agent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const HealthInsuranceList = () => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRecord, setSelectedRecord] =
    useState<HealthRecord | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("");

  const fetchRecords = async () => {
    setLoading(true);
    const res = await axios.get("/api/healthinsurance");
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

    await axios.post("/api/healthinsurance?assign=true", {
      policyId: selectedRecord?._id,
      agentId: selectedAgent,
    });

    alert("Lead Assigned Successfully!");
    setSelectedRecord(null);
    setSelectedAgent("");
    fetchRecords();
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Health Insurance List</h2>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
         <thead>
  <tr>
    <th>S.No</th>
    <th>Email</th>
    <th>Phone</th>
    <th>Assigned To</th>
    <th>Show </th>
  </tr>
</thead>


         <tbody>
  {records.map((r, index) => (
    <tr
      key={r._id}
      onClick={() => setSelectedRecord(r)}
    >
      <td>{index + 1}</td>

      <td>{r.email || "Unregistered"}</td>

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
          Show data
        </button>
      </td>
    </tr>
  ))}
</tbody>

        </table>
      </div>

      {selectedRecord && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Health Insurance Details</h3>

            <div className={styles.modalContent}>
              {Object.entries(selectedRecord).map(([key, value]) => (
                <p key={key}>
                  <strong>{key}</strong>
                  <span>
                    {Array.isArray(value)
                      ? JSON.stringify(value)
                      : value?.toString()}
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
                Assign Lead
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

export default HealthInsuranceList;
