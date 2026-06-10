"use client";

import React, { useState, useEffect } from "react";
import styles from "@/styles/pages/districtmanager.module.css";
import { useRouter } from "next/router";
import { useManager } from "@/lib/hooks/useManager";
import axios from "axios";

import DistrictManagerHeader from "@/components/districtmanagerdashboard/DistrictManagerHeader";
import DistrictManagerSidebar from "@/components/districtmanagerdashboard/districtmanagersidebar";
import DashboardContent from "@/components/districtmanagerdashboard/dashboardcontent";
import ResetPassword from "@/components/districtmanagerdashboard/resetpassword";
import AgentTable from "@/components/districtmanagerdashboard/listofagents";

type Agent = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  lifetimeSales: number;
  currentDMSales: number;
};

type SalesResponse = {
  success: boolean;
  totalSales: number;
  totalAgents: number;
  sales: { month: string; sales: number }[];
};

const DistrictManagerDashboard = () => {
  const router = useRouter();
  const { user } = useManager();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  const [agentData, setAgentData] = useState<Agent[]>([]);

  const [formattedTotalSales, setFormattedTotalSales] = useState("0");
  const [formattedMonthlySales, setFormattedMonthlySales] = useState("0");
  const [totalClients, setTotalClients] = useState(0);

  const [monthlySalesData, setMonthlySalesData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ✅ Fetch Agents
  const fetchAgents = async () => {
    try {
      const res = await axios.get("/api/getagent", {
        withCredentials: true,
      });

      if (res.data?.agents) {
        setAgentData(res.data.agents);
      }
    } catch (err) {
      console.error("Error fetching agents:", err);
    }
  };

  // ✅ Fetch DM Sales Summary
  const fetchManagerSales = async () => {
    try {
      const token = localStorage.getItem("managerToken");
      if (!token) return;

      const res = await axios.get<SalesResponse>("/api/manager/sales-summary", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        const total = res.data.totalSales ?? 0;

        setFormattedTotalSales(total.toLocaleString("en-IN"));
        setFormattedMonthlySales(total.toLocaleString("en-IN"));
        setTotalClients(res.data.totalAgents || 0);

        const monthlyArr =
          res.data.sales?.map((s: any) => ({
            month: s.month,
            sales: s.sales,
          })) || [];

        setMonthlySalesData(monthlyArr);
        setFilteredData(monthlyArr);
      }
    } catch (err) {
      console.error("Error fetching manager sales:", err);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchManagerSales();
  }, []);

  // ✅ DATE FILTER
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
      <DistrictManagerHeader
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleLogout={handleLogout}
      />

      <div className={styles.mainArea}>
        <DistrictManagerSidebar
          setActiveSection={setActiveSection}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          handleLogout={handleLogout}
        />

        <main className={styles.content}>
          {activeSection === "dashboard" && (
            <DashboardContent
              formattedTotalSales={formattedTotalSales}
              formattedMonthlySales={formattedMonthlySales}
              totalClients={totalClients}
              agents={agentData}
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              handleFilter={handleFilter}
              filteredData={filteredData}
            />
          )}

          {activeSection === "listofagent" && <AgentTable />}
          {activeSection === "resetpassword" && <ResetPassword />}
        </main>
      </div>
    </div>
  );
};

export default DistrictManagerDashboard;
