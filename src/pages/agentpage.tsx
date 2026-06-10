"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import agentbackground from "@/assets/dashboard_bg.webp";
import styles from "@/styles/pages/agent.module.css";

import AgentHeader from "@/components/agentpage/agentheader";
import AgentSidebar from "@/components/agentpage/agentsidebar";
import AgentContent from "@/components/agentpage/agentcontent";
import ResetPassword from "@/components/districtmanagerdashboard/resetpassword";
import CreateUser from "@/components/agentpage/createuser";
import CreateAgent from "@/components/superadminsidebar/createagent";
import AgentSale from "@/components/agentpage/agentsale";
import LeadSection from "@/components/agentpage/leadsection";
import ListOfPolicy from "@/pages/listofpolicy";
import DownloadCertificate from "@/components/agentpage/download";


const AgentDashboard = () => {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  const [agentName, setAgentName] = useState("");
  const [agentSales, setAgentSales] = useState(0);

  const [loading, setLoading] = useState(false);
  const [agent, setAgent] = useState<any>(null);

  /* ---------------------------------------
     LOAD AGENT NAME (UI PURPOSE ONLY)
  --------------------------------------- */
  useEffect(() => {
    const storedName = localStorage.getItem("agentName");
    if (storedName) setAgentName(storedName);
  }, []);

  /* ---------------------------------------
     FETCH AGENT PROFILE (COOKIE AUTH)
  --------------------------------------- */
  useEffect(() => {
    if (activeSection === "profileEdit") {
      setLoading(true);

      axios
        .get("/api/agents/me", { withCredentials: true }) // ✅ cookie auth
        .then((res) => setAgent(res.data))
        .catch((err) => {
          console.error("Error fetching agent:", err);
          if (err.response?.status === 401) {
            router.replace("/agentlogin");
          }
        })
        .finally(() => setLoading(false));
    }
  }, [activeSection, router]);

  /* ---------------------------------------
     LOGOUT (COOKIE BASED)
  --------------------------------------- */
  const handleLogout = async () => {
    try {
      await axios.post("/api/agent/logout", {}, { withCredentials: true });

      // UI cleanup only
      localStorage.removeItem("agentName");
      localStorage.removeItem("agentTestPassed");
      localStorage.removeItem("training_currentVideo");
      localStorage.removeItem("training_completed");
      localStorage.removeItem("training_testStarted");

      router.replace("/agentlogin");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* HEADER */}
      <AgentHeader
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleLogout={handleLogout}
      />

      <div className={styles.mainArea}>
        {/* SIDEBAR */}
        <AgentSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          setActiveSection={setActiveSection}
          activeSection={activeSection}
          handleLogout={handleLogout}
        />

        {/* CONTENT */}
       <main className={styles.content}>
  {/* BACKGROUND IMAGE */}
  <div
    className={styles.contentBackground}
    style={{ backgroundImage: `url(${agentbackground.src})` }}
  />

  {/* ACTUAL CONTENT */}
  <div className={styles.contentInner}>
    {activeSection === "dashboard" && (
      <AgentContent
        agentName={agentName}
        agentSales={agentSales}
        agentId={agent?._id || ""}
      />
    )}

    {activeSection === "leadsection" && <LeadSection />}
    {activeSection === "listofpolicy" && <ListOfPolicy />}
    {activeSection === "resetpassword" && <ResetPassword />}
    {activeSection === "createuser" && <CreateUser />}
    {activeSection === "addsale" && <AgentSale />}
    {activeSection === "profileEdit" && <CreateAgent />}
    {activeSection === "downloadCertificate" && <DownloadCertificate />}

  </div>
</main>

      </div>
    </div>
  );
};

export default AgentDashboard;
