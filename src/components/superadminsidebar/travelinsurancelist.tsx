"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "@/styles/components/superadminsidebar/travelinsurancelist.module.css";

const TravelInsuranceList = () => {
  const [travelPolicies, setTravelPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedPolicy, setSelectedPolicy] = useState<any | null>(null);

  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("");

  /* ---------------- FETCH POLICIES ---------------- */
  const fetchTravelPolicies = async () => {
    try {
      if (!refreshing) setLoading(true);
      const res = await axios.get("/api/travelinsurance");
      if (res.data?.success) {
        setTravelPolicies(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ---------------- FETCH AGENTS ---------------- */
  const fetchAgents = async () => {
    const res = await axios.get("/api/getallagents");
    setAgents(res.data || []);
  };

  useEffect(() => {
    fetchTravelPolicies();
  }, []);

  useEffect(() => {
    if (selectedPolicy) fetchAgents();
  }, [selectedPolicy]);

  /* ---------------- ASSIGN LEAD ---------------- */
  const handleAssignLead = async () => {
    if (!selectedAgent) {
      alert("Please select an agent");
      return;
    }

    await axios.post("/api/travelinsurance?assign=true", {
      policyId: selectedPolicy?._id,
      agentId: selectedAgent,
    });

    alert("Lead assigned successfully!");
    setSelectedPolicy(null);
    setSelectedAgent("");
    fetchTravelPolicies();
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.wrapper}>
      {/* HEADER */}
      <div className={styles.header}>
        <h2 className={styles.title}>Travel Insurance List</h2>

        <button
          className={styles.refreshBtn}
          onClick={() => {
            setRefreshing(true);
            fetchTravelPolicies();
          }}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {/* TABLE */}
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
            {travelPolicies.map((policy, index) => (
              <tr
                key={policy._id}
                onClick={() => setSelectedPolicy(policy)}   // ✅ ROW CLICK
              >
                <td>{index + 1}</td>
                <td>{policy.email || "-"}</td>
                <td>{policy.phoneNumber || "-"}</td>
                <td>{policy.assignedTo || "Not Assigned"}</td>

              

                <td>
                  <button
                    className={styles.showBtn}
                    onClick={(e) => {
                      e.stopPropagation();     // ✅ IMPORTANT
                      setSelectedPolicy(policy);
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

      {/* MODAL */}
      {selectedPolicy && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Travel Insurance Details</h3>

           <div className={styles.modalContent}>
  {Object.entries(selectedPolicy).map(([key, value]) => (
    <div key={key} className={styles.field}>
      <label className={styles.label}>{key}</label>
      <div className={styles.valueBox}>
        {typeof value === "object"
          ? JSON.stringify(value)
          : value?.toString() || "-"}
      </div>
    </div>
  ))}
</div>


            {/* ASSIGN */}
            <div className={styles.assignBox}>
              <label><strong>Assign To Agent</strong></label>

              <select
                className={styles.agentDropdown}
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
              >
                <option value="">Select Agent</option>
                {agents.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    {agent.firstName} {agent.lastName} ({agent.email})
                  </option>
                ))}
              </select>

              <div className={styles.modalFooter}>
        <button
          className={styles.assignBtn}
          onClick={handleAssignLead}
        >
          Assign To Agent
        </button>

        <button
          className={styles.closeBtn}
          onClick={() => setSelectedPolicy(null)}
        >
          Close
        </button>
      </div>
            </div>

          
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelInsuranceList;
