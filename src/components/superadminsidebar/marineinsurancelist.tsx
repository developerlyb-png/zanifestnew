"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "@/styles/components/superadminsidebar/marineinsurancelist.module.css";

interface MarineRecord {
  _id: string;
  phoneNumber: string;
  email?: string | null;
  commodity?: string;
  coverType?: string;
  shipmentType?: string;
  companyName?: string;
  transportMode?: string;
  coverAmount?: string;
  assignedAgentName?: string | null;
  assignedAgent?: string | null;
  createdAt: string;
  [key: string]: any;
}

interface Agent {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  name?: string;
}

const MarineInsuranceList = () => {
  const [data, setData] = useState<MarineRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<MarineRecord | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [assignedAgent, setAssignedAgent] = useState("");

  // ---------- FETCH MARINE DATA ----------
  const fetchData = async () => {
    setLoading(true);
    const res = await axios.get("/api/p");
    setData(res.data.data || []);
    setLoading(false);
  };

  // ---------- FETCH AGENTS ----------
  const fetchAgents = async () => {
    const res = await axios.get("/api/getallagents");
    setAgents(res.data || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selected) fetchAgents();
  }, [selected]);

  const getAgentName = (a?: Agent) => {
    if (!a) return "";
    if (a.firstName || a.lastName) return `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim();
    return a.name ?? "";
  };

  // ---------- ASSIGN AGENT ----------
  const assignAgentHandler = async () => {
    if (!assignedAgent || !selected) return alert("Please select an agent");

    const agent = agents.find((a) => a._id === assignedAgent);
    const agentName = getAgentName(agent);

    const res = await axios.put("/api/p", {
      marineId: selected._id,
      agentId: assignedAgent,
      agentName,
    });

    if (res.data.success) {
      alert("Agent assigned successfully!");
      setSelected(null);
      setAssignedAgent("");
      fetchData();
    } else {
      alert("Failed to assign agent");
    }
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.miContainer}>
      <div className={styles.miHeader}>
        <h2 className={styles.miTitle}>Marine Insurance List</h2>
      </div>

      <div className={styles.miTableWrapper}>
        <table className={styles.miTable}>
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
            {data.map((item, idx) => (
              <tr
                key={item._id}
                onClick={() => setSelected(item)}   // ✅ ROW CLICK
              >
                <td>{idx + 1}</td>
                <td>{item.email || "Unregistered"}</td>
                <td>{item.phoneNumber}</td>
                <td>{item.assignedAgentName || "Not Assigned"}</td>

                <td>
                  <button
                    className={styles.showBtn}
                    onClick={(e) => {
                      e.stopPropagation();          // ✅ IMPORTANT
                      setSelected(item);
                    }}
                  >
                    Show Data
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------- MODAL ---------- */}
      {selected && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <h3 className={styles.modalTitle}>Marine Insurance Details</h3>

            <div className={styles.modalContent}>
  {Object.entries(selected).map(([k, v]) => (
    <p key={k} className={styles.para}>
      <span className={styles.label}>{k}</span>
      <span className={styles.value}>
        {typeof v === "object" ? JSON.stringify(v) : v?.toString()}
      </span>
    </p>
  ))}
</div>


            <div className={styles.agentSelectBox}>
              <label>Select Agent</label>
              <select
                className={styles.agentDropdown}
                value={assignedAgent}
                onChange={(e) => setAssignedAgent(e.target.value)}
              >
                <option value="">-- Select Agent --</option>
                {agents.map((a) => (
                  <option key={a._id} value={a._id}>
                    {getAgentName(a)} ({a.email})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.assignBtn} onClick={assignAgentHandler}>
                Assign To Agent
              </button>
              <button className={styles.closeBtn} onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarineInsuranceList;
