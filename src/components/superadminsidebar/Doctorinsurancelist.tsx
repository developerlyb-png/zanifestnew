"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "@/styles/components/superadminsidebar/doctorinsurancelist.module.css";

interface DoctorData {
  _id: string;
  name: string;
  email: string | null;
  mobile: string;
  whatsapp: boolean;
  specialization?: string;
  firstTime?: string | null;
  facility?: string | null;
  createdAt: string;

  assignedTo?: string | null;
  assignedAt?: string | null;
  assignedAgent?: string | null;

  [key: string]: any;
}

interface Agent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const Doctorinsurancelist = () => {
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRecord, setSelectedRecord] =
    useState<DoctorData | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("");

  const fetchDoctors = async () => {
    setLoading(true);
    const res = await axios.get("/api/doctorinsurance");
    setDoctors(res.data.data || []);
    setLoading(false);
  };

  const fetchAgents = async () => {
    const res = await axios.get("/api/getallagents");
    setAgents(res.data || []);
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedRecord) fetchAgents();
  }, [selectedRecord]);

  const handleAssign = async () => {
    if (!selectedAgent) return alert("Please select an agent");

    await axios.post("/api/doctorinsurance?assign=true", {
      policyId: selectedRecord?._id,
      agentId: selectedAgent,
    });

    alert("Lead Assigned!");
    setSelectedRecord(null);
    setSelectedAgent("");
    fetchDoctors();
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Doctor Insurance List</h2>

      {/* ================= TABLE ================= */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Assigned To</th>
              <th>Show</th>
            </tr>
          </thead>

          <tbody>
            {doctors.map((doc, index) => (
              <tr
                key={doc._id}
                onClick={() => setSelectedRecord(doc)}
              >
                <td>{index + 1}</td>
                <td>{doc.name}</td>
                <td>{doc.email || "Unregistered"}</td>
                <td>{doc.mobile}</td>
                <td>{doc.assignedTo || "Not Assigned"}</td>
                <td>
                  <button
                    className={styles.showBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRecord(doc);
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
            <h3>Doctor Insurance Details</h3>

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
};

export default Doctorinsurancelist;
