"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "@/styles/pages/districtmanager.module.css";
import { FaRupeeSign } from "react-icons/fa";
import { FiBarChart2, FiUsers, FiUser } from "react-icons/fi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

type Agent = {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  lifetimeSales: number;
  currentDMSales: number;
};

type MonthlySales = {
  month: string;
  sales: number;
};

type DashboardContentProps = {
  formattedTotalSales: string;
  formattedMonthlySales: string;
  agents: Agent[];
  totalClients: number;
  startDate: string;
  endDate: string;
  setStartDate: (d: string) => void;
  setEndDate: (d: string) => void;
  handleFilter: () => void;
  filteredData: MonthlySales[];
};

const DashboardContent: React.FC<DashboardContentProps> = ({
  formattedTotalSales,
  formattedMonthlySales,
  agents,
  totalClients,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  handleFilter,
  filteredData,
}) => {
  const [dmTotalSales, setDmTotalSales] = useState("0");
  const [loading, setLoading] = useState(false);

  const fetchDistrictManagerSales = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("managerToken");
      if (!token) return;

      const res = await axios.get("/api/manager/sales-summary", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success && res.data.totalSales !== undefined) {
        setDmTotalSales(res.data.totalSales.toLocaleString("en-IN"));
      } else {
        setDmTotalSales("0");
      }
    } catch (err) {
      console.error("Error fetching DM sales:", err);
      setDmTotalSales("0");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistrictManagerSales();
  }, []);

  return (
    <main className={styles.content}>
      <h2 className={styles.title}>District Manager Dashboard</h2>

      {/* Cards */}
      <div className={styles.cardGrid}>
        <div className={styles.card}>
          <FaRupeeSign className={styles.cardIcon} />
          <div>
            <p>Total Sales</p>
            <h3>{loading ? "Loading..." : `₹${dmTotalSales}`}</h3>
          </div>
        </div>

        <div className={styles.card}>
          <FiBarChart2 className={styles.cardIcon} />
          <div>
            <p>Monthly Sales</p>
            <h3>₹{formattedMonthlySales}</h3>
          </div>
        </div>

        <div className={styles.card}>
          <FiUsers className={styles.cardIcon} />
          <div>
            <p>Number of Agents</p>
            <h3>{agents.length}</h3>
          </div>
        </div>

        <div className={styles.card}>
          <FiUser className={styles.cardIcon} />
          <div>
            <p>Total Clients</p>
            <h3>{totalClients}</h3>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className={styles.dateFilterSection}>
        <label>
          Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>

        <label>
          End Date:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>

        <button className={styles.filterButton} onClick={handleFilter}>
          Show
        </button>
      </div>

      {/* Chart */}
      <div className={styles.chartContainer}>
        <h3 className={styles.chartTitle}>Monthly Sales Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#007bff"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
};

export default DashboardContent;
