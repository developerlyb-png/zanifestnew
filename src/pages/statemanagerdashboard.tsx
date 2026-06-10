"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import styles from "@/styles/pages/statemanager.module.css";
import { useManager } from "@/lib/hooks/useManager";

import StateManagerHeader from "@/components/statemanagerdashboard/statemanagerheader";
import StateManagerContent from "@/components/statemanagerdashboard/statemanagercontent";
import StateManagerSidebar from "@/components/statemanagerdashboard/statemanagersidebar";
import ResetPassword from "@/components/districtmanagerdashboard/resetpassword";
import ListOfDistrictManager from "@/components/statemanagerdashboard/listofdistrictmanager";

interface SalesResponse {
  success: boolean;
  totalSales: number;
  totalAgents: number;
  totalDistrictManagers: number;
  sales: { month: string; sales: number }[];
}

const StateManagerDashboard = () => {
  const router = useRouter();
  const { user } = useManager();

  const [districtManagers, setDistrictManagers] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  // ✅ Dashboard state
  const [totalSales, setTotalSales] = useState(0);
  const [totalAgents, setTotalAgents] = useState(0);
  const [totalDM, setTotalDM] = useState(0);

  const [monthlySalesData, setMonthlySalesData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ✅ Fetch District Managers (table list)
  useEffect(() => {
    axios.get("/api/manager/getdistrictmanagers").then((res) => {
      setDistrictManagers(res.data.data || []);
    });
  }, []);

  // ✅ Fetch State Manager Sales Summary
  const fetchSalesSummary = async () => {
    try {
      const token = localStorage.getItem("managerToken");
      if (!token) return;

      const res = await axios.get<SalesResponse>("/api/manager/sales-summary", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setTotalSales(res.data.totalSales || 0);
        setTotalAgents(res.data.totalAgents || 0);
        setTotalDM(res.data.totalDistrictManagers || 0);

        const monthlyArr =
          res.data.sales?.map((s: any) => ({
            month: s.month,
            sales: s.sales,
          })) || [];

        setMonthlySalesData(monthlyArr);
        setFilteredData(monthlyArr);
      }
    } catch (err) {
      console.error("⚠️ State Manager summary error:", err);
    }
  };

  useEffect(() => {
    fetchSalesSummary();
  }, []);

  // ✅ Date Filter
  const handleFilter = () => {
    if (!startDate || !endDate) {
      setFilteredData(monthlySalesData);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const filtered = monthlySalesData.filter((entry: any) => {
      const d = new Date(entry.month);
      return d >= start && d <= end;
    });

    setFilteredData(filtered);
  };

  // ✅ Logout
  const handleLogout = async () => {
    try {
      localStorage.removeItem("managerToken");
      router.replace("/managerlogin");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className={styles.wrapper}>
      <StateManagerHeader
        user={user ?? undefined}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleLogout={handleLogout}
      />

      <div className={styles.mainArea}>
        <StateManagerSidebar
          setActiveSection={setActiveSection}
          activeSection={activeSection}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          handleLogout={handleLogout}
        />

        <main className={styles.content}>
          {activeSection === "dashboard" && (
       <StateManagerContent
  formattedTotalSales={totalSales.toLocaleString("en-IN")}
  formattedMonthlySales={totalSales.toLocaleString("en-IN")}
  totalClients={totalAgents}
  totalDistrictManagers={totalDM}
  districtManagers={districtManagers}
  showAgentList={false}
  setShowAgentList={() => {}}
  startDate={startDate}
  endDate={endDate}
  setStartDate={setStartDate}
  setEndDate={setEndDate}
  handleFilter={handleFilter}
  filteredData={filteredData}
/>

          )}

          {activeSection === "resetpassword" && <ResetPassword />}
          {activeSection === "listofdistrictmanager" && (
            <ListOfDistrictManager />
          )}
        </main>
      </div>
    </div>
  );
};

export default StateManagerDashboard;
