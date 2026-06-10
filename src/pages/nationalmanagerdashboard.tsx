"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "@/styles/pages/nationalmanager.module.css";
import { useRouter } from "next/router";
import { useManager } from "@/lib/hooks/useManager";

import NationalManagerHeader from "@/components/nationalmanagerdashboard/nationalmanagerheader";
import NationalManagerSidebar from "@/components/nationalmanagerdashboard/nationalmanagersidebar";
import DashboardContent from "@/components/nationalmanagerdashboard/dashboardcontent";
import ResetPassword from "@/components/districtmanagerdashboard/resetpassword";
import ListOfStateManager from "@/components/nationalmanagerdashboard/listofstatemanager";
import CreateManager from "@/components/superadminsidebar/createmanager";

interface SalesResponse {
  success: boolean;
  totalSales: number;
  totalAgents: number;
  totalStateManagers: number;
  totalDistrictManagers: number;
  sales: { month: string; sales: number }[];
}

const NationalManagerDashboard = () => {
  const router = useRouter();
  const { user } = useManager();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  const [stateManagers, setStateManagers] = useState<any[]>([]);

  const [totalSales, setTotalSales] = useState(0);
  const [totalAgents, setTotalAgents] = useState(0);
  const [totalStateManagers, setTotalStateManagers] = useState(0);
  const [totalDistrictManagers, setTotalDistrictManagers] = useState(0);

  const [monthlySalesData, setMonthlySalesData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [manager, setManager] = useState<any>(null);

  /* ✅ Fetch State Managers assigned under National Manager */
  useEffect(() => {
    const fetchStateManagers = async () => {
      try {
        const token = localStorage.getItem("managerToken");

        const res = await axios.get("/api/manager/state-with-sales", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStateManagers(res.data.data || []);
      } catch (err) {
        console.error("Error fetching assigned state managers:", err);
      }
    };

    fetchStateManagers();
  }, []);

  /* ✅ Fetch Sales Summary for National*/
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
        setTotalDistrictManagers(res.data.totalDistrictManagers || 0);
        setTotalStateManagers(res.data.totalStateManagers || 0);

        const monthlyArr =
          res.data.sales?.map((s) => ({
            month: s.month,
            sales: s.sales,
          })) || [];

        setMonthlySalesData(monthlyArr);
        setFilteredData(monthlyArr);
      }
    } catch (err) {
      console.error("National summary error:", err);
    }
  };

  useEffect(() => {
    fetchSalesSummary();
  }, []);

  /* ✅ DATE FILTER */
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

  /* ✅ LOGOUT */
  const handleLogout = async () => {
    try {
      await axios.post("/api/manager/logout");
      localStorage.removeItem("managerToken");
      router.replace("/managerlogin");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className={styles.wrapper}>
      <NationalManagerHeader
        user={user ?? undefined}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleLogout={handleLogout}
      />

      <div className={styles.mainArea}>
        <NationalManagerSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          handleLogout={handleLogout}
        />

        <main className={styles.content}>
          {/* ✅ Dashboard Content */}
          {activeSection === "dashboard" && (
            <DashboardContent
              totalClients={totalAgents}
              totalDistrictManagers={totalDistrictManagers}
              totalStateManagers={totalStateManagers}
              formattedTotalSales={totalSales.toLocaleString("en-IN")}
              formattedMonthlySales={totalSales.toLocaleString("en-IN")}
              showAgentList={false}
              setShowAgentList={() => {}}
              stateManagers={stateManagers}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              handleFilter={handleFilter}
              filteredData={filteredData}
            />
          )}

          {activeSection === "resetpassword" && <ResetPassword />}
          {activeSection === "listofstatemanager" && <ListOfStateManager />}
          {activeSection === "profileEdit" && (
            <CreateManager mode="edit" initialData={manager} />
          )}
        </main>
      </div>
    </div>
  );
};

export default NationalManagerDashboard;
