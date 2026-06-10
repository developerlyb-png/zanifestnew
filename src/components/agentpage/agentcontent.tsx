"use client";
import React, { useState, useEffect } from "react";
import styles from "@/styles/pages/agent.module.css";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Label } from "recharts";


import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AgentContentProps {
  agentName: string;
  agentSales: number;
  agentId?: string;
  assignedTo?: string;
}

interface SaleRecord {
  amount: number;
  saleDate: string;
}

const AgentContent: React.FC<AgentContentProps> = ({
  agentName,
  agentSales,
  agentId,
  assignedTo: initialAssignedTo,
}) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [chartData, setChartData] = useState<any[]>([]);
  const [salesAmount, setSalesAmount] = useState<number>(0);
  const [totalSales, setTotalSales] = useState<number>(agentSales);
  const [salesBreakdown, setSalesBreakdown] =
    useState<{ lifetime: number; underCurrentDM: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [assignedTo, setAssignedTo] = useState<string>(
    initialAssignedTo || ""
  );

  const [dmHistory, setDmHistory] = useState<
    { dmId: string; sales: number }[]
  >([]);

  const [salesList, setSalesList] = useState<SaleRecord[]>([]);
  const [monthlySales, setMonthlySales] = useState<number>(0);

  const [totalClients, setTotalClients] = useState<number>(0);

  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

  const combinedDmSales = dmHistory.reduce(
    (sum, entry) => sum + entry.sales,
    0
  );

  /* =====================================================
     ✅ ADDITION ONLY — AGENT NAME FALLBACK
     (NO EXISTING CODE TOUCHED)
  ===================================================== */
  const [agentNameState, setAgentNameState] = useState<string>("");

  useEffect(() => {
    if (agentName) {
      setAgentNameState(agentName);
      return;
    }

    const fetchAgentName = async () => {
      try {
        const res = await axios.get("/api/agent/me", {
          withCredentials: true,
        });

        const agent = res.data?.agent;
        if (agent?.firstName) {
          setAgentNameState(
            `${agent.firstName} ${agent.lastName || ""}`.trim()
          );
        }
      } catch (err) {
        console.error("Failed to fetch agent name:", err);
      }
    };

    fetchAgentName();
  }, [agentName]);
  /* ===================================================== */

  const fetchAgentSales = async () => {
    try {
      const res = await axios.get("/api/agent/get-sales", {
        withCredentials: true,
      });

      if (res.data.success) {
        setSalesBreakdown(res.data.sales);
        setTotalSales(res.data.sales.lifetime);
        setAssignedTo(res.data.assignedTo || "");
        setDmHistory(res.data.sales.dmHistory || []);
        setSalesList(res.data.sales.allSales || []);
        updateMonthlySales(res.data.sales.allSales || []);
        setTotalClients(0);
      }
    } catch (err) {
      console.error("Failed to fetch sales:", err);
      toast.error("Failed to fetch sales data");
    }
  };
const updateMonthlySales = (sales: SaleRecord[]) => {
  const now = new Date();

  const filtered = sales.filter((s) => {
    if (!s.saleDate) return false;

    const d = new Date(s.saleDate);
    if (isNaN(d.getTime())) return false;

    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });

  const total = filtered.reduce(
    (sum, s) => sum + Number(s.amount || 0),
    0
  );

  setMonthlySales(total);
  updateChart(filtered);
};

const updateChart = (sales: SaleRecord[]) => {
  if (!sales || sales.length === 0) {
    setChartData([]);
    return;
  }

  const map: Record<string, number> = {};

  sales.forEach((s) => {
    if (!s.saleDate) return;

    const d = new Date(s.saleDate);
    if (isNaN(d.getTime())) return;

    const key = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });

    map[key] = (map[key] || 0) + (Number(s.amount) || 0);
  });

  const formatted = Object.keys(map).map((date) => ({
    date,
    amount: map[date],
  }));

  setChartData(formatted);
};



  useEffect(() => {
    fetchAgentSales();
  }, []);

  const handleFilter = () => {
    if (!startDate || !endDate) {
      updateMonthlySales(salesList);
      return;
    }
    const filtered = salesList.filter((item) => {
      const itemDate = new Date(item.saleDate);
      return (
        itemDate >= new Date(startDate) &&
        itemDate <= new Date(endDate)
      );
    });
    updateChart(filtered);
  };

  const handleAddSale = async () => {
    if (salesAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        "/api/agent/add-sales",
        { agentId, amount: salesAmount },
        { withCredentials: true }
      );

      toast.success(`Sale added! ₹${salesAmount}`);
      setSalesAmount(0);
      fetchAgentSales();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add sale");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
  console.log("chartData:", chartData);
}, [chartData]);


  return (
    <main className={styles.content}>
      <h2 className={styles.dashboardTitle}>
        Hello, {agentName || agentNameState}
      </h2>

      {/* ✅ EVERYTHING BELOW IS 100% YOUR ORIGINAL CODE */}

      {/* Info Cards */}
      <div className={styles.cardGrid}>
        {dmHistory.length > 0 && (
          <div className={styles.infoCard}>
            <h3>DM History</h3>
            <h4>Total Transferred Sale: ₹{combinedDmSales}</h4>
            <button
              className={styles.breakdownBtn}
              onClick={() => setShowBreakdownModal(true)}
            >
              Breakdown
            </button>
          </div>
        )}

        <div className={styles.infoCard}>
          <h3>Sales This Month</h3>
          <p className={styles.amount}>₹{monthlySales}</p>
        </div>

        <div className={styles.infoCard}>
          <h3>Number of Clients</h3>
          <p className={styles.amount}>{totalClients}</p>
        </div>
      </div>

      {/* BREAKDOWN MODAL */}
      {showBreakdownModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <h2>DM Breakdown</h2>
            <table className={styles.modalTable}>
              <thead>
                <tr>
                  <th>DM ID</th>
                  <th>Sale</th>
                </tr>
              </thead>
              <tbody>
                {dmHistory.map((dm) => (
                  <tr key={dm.dmId}>
                    <td>{dm.dmId}</td>
                    <td>₹{dm.sales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className={styles.closeBtn}
              onClick={() => setShowBreakdownModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ADD SALES */}
      <div className={styles.addSalesSection}>
        <h3>Add New Sale</h3>
        <div className={styles.addSalesForm}>
          <input
            type="number"
            placeholder="Enter sale amount"
            value={salesAmount}
            onChange={(e) => setSalesAmount(Number(e.target.value))}
            className={styles.input}
          />
          <button
            className={styles.addSalesBtn}
            onClick={handleAddSale}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Sale"}
          </button>
        </div>
      </div>

      {/* DATE FILTER */}
      <div className={styles.dateFilterSection}>
        <label className={styles.dateLabel}>
          Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label className={styles.dateLabel}>
          End Date:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <div className={styles.buttonWrapper}>
          <button
            className={styles.filterButton}
            onClick={handleFilter}
          >
            Show
          </button>
        </div>
      </div>

      {/* GRAPH */}
 
<div className={styles.chartContainer}>
  <h3 className={styles.chartTitle}>
    Monthly Sales Overview
  </h3>

  {chartData.length > 0 ? (
    <LineChart
      width={1300}        // 🔥 FIXED WIDTH
      height={420}       // 🔥 FIXED HEIGHT
      data={chartData}
      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
    >
      <CartesianGrid strokeDasharray="3 3" />

    <XAxis dataKey="date" tick={{ fontSize: 12 }}>
  <Label
    value="Time"
    offset={-5}
    position="insideBottom"
  />
</XAxis>

     <YAxis tickFormatter={(value) => `₹${value}`} tick={{ fontSize: 12 }}>
  <Label
    value="Amount"
    angle={-90}
    position="insideLeft"
    style={{ textAnchor: "middle" }}
  />
</YAxis>

      <Tooltip formatter={(value: number) => `₹${value}`} />

      <Line
        type="monotone"
        dataKey="amount"
        stroke="#2dd4bf"
        strokeWidth={3}
        dot={{ r: 5 }}
        activeDot={{ r: 7 }}
      />
    </LineChart>
  ) : (
    <p style={{ textAlign: "center", marginTop: 40 }}>
      No sales data available
    </p>
  )}
</div>



    </main>
  );
};

export default AgentContent;
