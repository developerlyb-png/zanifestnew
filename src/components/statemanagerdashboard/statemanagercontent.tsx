"use client";
import React from "react";
import {
  FiBarChart2,
  FiUsers,
  FiUser,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import styles from "@/styles/pages/statemanager.module.css";

type ChartData = {
  month: string;
  sales: number;
};

type Props = {
  formattedTotalSales: string;
  formattedMonthlySales: string;
  totalClients: number;
  totalDistrictManagers: number;
  districtManagers: any[];
  showAgentList: boolean;
  setShowAgentList: (show: boolean) => void;
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  handleFilter: () => void;
  filteredData: ChartData[];
};

const StateManagerContent: React.FC<Props> = ({
  formattedTotalSales,
  formattedMonthlySales,
  totalClients,
  totalDistrictManagers,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  handleFilter,
  filteredData,
}) => {
  return (
    <main className={styles.content}>
      <h2 className={styles.title}>State Manager Dashboard</h2>

      <div className={styles.cardGrid}>
        <div className={styles.card}>
          <FaRupeeSign className={styles.cardIcon} />
          <div>
            <p>Total Sales</p>
            <h3>₹{formattedTotalSales}</h3>
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
            <p>Total Clients</p>
            <h3>{totalClients}</h3>
          </div>
        </div>

        <div className={styles.card}>
          <FiUser className={styles.cardIcon} />
          <div>
            <p>Total District Managers</p>
            <h3>{totalDistrictManagers}</h3>
          </div>
        </div>
      </div>

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

        <button className={styles.filterButton} onClick={handleFilter}>
          Show
        </button>
      </div>

      <div className={styles.chartContainer}>
        <h3 className={styles.chartTitle}>Monthly Sales Chart</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="sales" stroke="#007bff" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </main>
  );  
};

export default StateManagerContent;
