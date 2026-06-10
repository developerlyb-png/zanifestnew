"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import styles from "@/styles/pages/agentsale.module.css";

interface Agent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  sales: number;
  assignedTo?: { name: string };
}

export default function AgentDashboard() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios
      .get("/api/agent/me", { withCredentials: true }) // ✅ COOKIE
      .then((res) => setAgent(res.data.agent))
      .catch(() => toast.error("Failed to load agent"));
  }, []);

  const handleAddSale = async () => {
    if (!agent || amount <= 0) return toast.error("Invalid amount");

    try {
      setLoading(true);

      const res = await axios.post(
        "/api/agent/add-sales",
        { agentId: agent._id, amount },
        { withCredentials: true } // ✅ COOKIE
      );

      setAgent((prev) =>
        prev ? { ...prev, sales: res.data.newSales.lifetime } : prev
      );

      toast.success("Sale added");
      setAmount(0);
    } catch {
      toast.error("Failed to add sale");
    } finally {
      setLoading(false);
    }
  };

  if (!agent) return <div>Loading...</div>;

  return (
    <div className={styles.container}>
      <h1>Agent Dashboard</h1>
      <p>Total Sales: ₹{agent.sales}</p>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />

      <button onClick={handleAddSale} disabled={loading}>
        {loading ? "Adding..." : "Add Sale"}
      </button>
    </div>
  );
}
  