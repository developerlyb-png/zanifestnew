"use client";

import React, { useEffect, useState } from "react";
import styles from "@/styles/pages/districtmanager.module.css";
import axios from "axios";

type Agent = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  district?: string;
  city?: string;
  state?: string;
  lifetimeSales?: number;
  currentDMSales?: number;
};

const getTotalSales = (agent: Agent) => {
  return (
    Number(agent.currentDMSales) ||
    Number(agent.lifetimeSales) ||
    0
  );
};

const AgentTable: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    try {
      const res = await axios.get("/api/getagent", {
        withCredentials: true,
      });

      if (res.data?.agents) setAgents(res.data.agents);
    } catch (err) {
      console.error("Error fetching agents:", err);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return (
    <div className={styles.agentTable}>
      <h3 className={styles.tableTitle}>Agents Under You</h3>

      <div className={styles.tableWrapper}>
        {loading ? (
          <p style={{ textAlign: "center" }}>Loading agents...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>District</th>
                <th>City</th>
                <th>State</th>
                <th>Total Sales</th>
              </tr>
            </thead>

            <tbody>
              {agents.length > 0 ? (
                agents.map((agent) => (
                  <tr key={agent._id}>
                    <td>{agent.firstName} {agent.lastName}</td>
                    <td>{agent.email}</td>
                    <td>{agent.district}</td>
                    <td>{agent.city}</td>
                    <td>{agent.state}</td>
                    <td>₹{getTotalSales(agent).toLocaleString("en-IN")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center" }}>
                    No agents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AgentTable;
