"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "@/styles/components/superadminsidebar/travelinsurancelist.module.css";
import { FiDownload, FiSearch } from "react-icons/fi";

const TravelInsuranceList = () => {
  const [travelPolicies, setTravelPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedPolicy, setSelectedPolicy] = useState<any | null>(null);

  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [assignFilter, setAssignFilter] = useState<"all" | "assigned" | "unassigned">("all");

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

  const filteredPolicies = travelPolicies
    .filter((policy) =>
      assignFilter === "all"
        ? true
        : assignFilter === "assigned"
        ? !!policy.assignedTo
        : !policy.assignedTo
    )
    .filter((policy) =>
      `${policy.email || ""} ${policy.phoneNumber || ""} ${policy.assignedTo || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

  const exportCsv = () => {
    const headers = ["S.No", "Email", "Phone", "Assigned To"];
    const rows = filteredPolicies.map((policy, index) => [
      index + 1,
      policy.email || "-",
      policy.phoneNumber || "-",
      policy.assignedTo || "Not Assigned",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "travel-insurance-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.wrapper}>
      {/* HEADER */}
      <div className={styles.header}>
        <h2 className={styles.title}>Travel Insurance List</h2>

        <div style={{ display: "flex", gap: 10 }}>
          <button className={styles.exportBtn} onClick={exportCsv}>
            <FiDownload size={15} /> Export CSV
          </button>
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
            {filteredPolicies.map((policy, index) => (
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
