"use client";
import React from "react";
import styles from "@/styles/pages/nationalmanager.module.css";
import {
  FiUsers,
  FiBarChart2,
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

type Manager = {
  _id: string;
  name: string;
  email: string;
  location: {
    state: string;
  };
};

type ChartData = {
  month: string;
  sales: number;
};

type Props = {
  totalClients: number;
  totalDistrictManagers: number;
  totalStateManagers: number;
  formattedTotalSales: string;
  formattedMonthlySales: string;
  showAgentList: boolean;
  setShowAgentList: (val: boolean) => void;
  stateManagers: Manager[];
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  handleFilter: () => void;
  filteredData: ChartData[];
};

const DashboardContent: React.FC<Props> = ({
  totalClients,
  totalDistrictManagers,
  totalStateManagers,
  formattedTotalSales,
  formattedMonthlySales,
  showAgentList,
  setShowAgentList,
  stateManagers,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  handleFilter,
  filteredData,
}) => {
  return (
    <>
      <h2 className={styles.title}>National Manager Dashboard</h2>

      {/* DESKTOP CARDS */}
      <div className={styles.cardGridDesktop}>
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
              <p>Number of Agents</p>
              <h3>{totalClients}</h3>
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

        <div className={styles.cardGrid}>

          <div className={styles.card}>
            <FiUser className={styles.cardIcon} />
            <div>
              <p>Total District Managers</p>
              <h3>{totalDistrictManagers}</h3>
            </div>
          </div>

          <div className={styles.card}>
            <FiUser className={styles.cardIcon} />
            <div>
              <p>Total State Managers</p>
              <h3>{totalStateManagers}</h3>
            </div>
          </div>

        </div>
      </div>

      {/* MOBILE CARDS */}
      <div className={styles.mobileCardWrapper}>
        <div className={styles.cardGrid}>
          {[
            { icon: <FaRupeeSign />, label: "Total Sales", value: `₹${formattedTotalSales}` },
            { icon: <FiBarChart2 />, label: "Monthly Sales", value: `₹${formattedMonthlySales}` },
            { icon: <FiUsers />, label: "Number of Agents", value: totalClients },
            { icon: <FiUser />, label: "Total Clients", value: totalClients },
            { icon: <FiUser />, label: "Total District Managers", value: totalDistrictManagers },
            { icon: <FiUser />, label: "Total State Managers", value: totalStateManagers },
          ].map((item, idx) => (
            <div className={styles.card} key={idx}>
              <span className={styles.cardIcon}>{item.icon}</span>
              <div>
                <p>{item.label}</p>
                <h3>{item.value}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Date Filter */}
      <div className={styles.dateFilterSection}>
        <label className={styles.dateLabel}>
          Start Date:
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>

        <label className={styles.dateLabel}>
          End Date:
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>

        <div className={styles.buttonWrapper}>
          <button className={styles.filterButton} onClick={handleFilter}>
            Show
          </button>
        </div>
      </div>

      {/* SALES CHART */}
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
    </>
  );
};

export default DashboardContent;
