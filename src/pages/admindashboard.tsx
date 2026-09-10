"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import logo from "@/assets/logo.png";
import CreateAdmin from "@/components/superadminsidebar/createadmin";
import CreateManager from "@/components/superadminsidebar/createmanager";
import AgentList from "@/components/superadminsidebar/agentlist";
import ManagerList from "@/components/superadminsidebar/managerlist";
import UserList from "@/components/superadminsidebar/userList";
import CreateAgent from "@/components/superadminsidebar/createagent";
import ChangePassword from "@/components/superadminsidebar/changepasswords";
import ResetPassword from "@/components/superadminsidebar/resetpassword";
import PolicyDashboard from "@/components/superadminsidebar/PolicyDashboard";
import ConfigManagement from "@/components/superadminsidebar/ConfigManagement";
import styles from "@/styles/pages/admindashboard.module.css";
import { useRouter } from "next/router";
// import withAuth from "@/lib/withAuth";
import { useAdmin } from "@/lib/hooks/useAdmin";


import {
  FiUsers,
  FiUserPlus,
  FiKey,
  FiLock,
  FiMenu,
  FiX,
  FiGrid,
  FiUserCheck,
  FiBriefcase,
  FiUser,
  FiFileText,
  FiSettings,
} from "react-icons/fi";
import axios from "axios";

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
   const [adminCount, setAdminCount] = useState(0);
    const [agentCount, setAgentCount] = useState(0);
    const [stateManagerCount, setStateManagerCount] = useState(0);
    const [districtManagerCount, setDistrictManagerCount] = useState(0);
    const [policyCount, setPolicyCount] = useState(0);
const router = useRouter();
  

   const { admin, loading } = useAdmin();
   console.log("Admin data:", admin?.userFirstName);

     const adminName = typeof window !== "undefined" ? localStorage.getItem("adminName") : null;


   const handleLogout = () => {
    try{
       axios.post("/api/admin/logout");
       console.log("logout")
      localStorage.removeItem("adminToken");
// 3. Force full page reload
    window.location.reload();

    // 4. Redirect to home after a short delay (after reload completes)
    setTimeout(() => {
      window.location.href = "/";
    }, 100); // enough time to ensure reload completes first
    }
    catch(error){
      console.error("Logout failed:", error);

    }
  };

  //to get the count of agents
    useEffect(() => {
      const fetchAdminCount = async () => {
        const res = await fetch("/api/getadmin");
        const data = await res.json();
        setAdminCount(data.length);
      };
      fetchAdminCount();
    }, []);
  
    useEffect(() => {
      const fetchAgentCount = async () => {
        const res = await fetch("/api/getallagents");
        console.log("res for count of agents: ", res);
        const data = await res.json();
        console.log("data for agent count:", data);
        console.log("Data length for agent count:", data.length);
        setAgentCount(data.length);
      };
      fetchAgentCount();
    }, []);
  
    useEffect(() => {
      const fetchManagerCounts = async () => {
        const res = await fetch("/api/getmanager");
        const managers = await res.json();
        setStateManagerCount(managers.filter((m: { category: string }) => m.category === "state").length);
        setDistrictManagerCount(managers.filter((m: { category: string }) => m.category === "district").length);
      };
      fetchManagerCounts();
    }, []);

    useEffect(() => {
      const fetchPolicyCount = async () => {
        try {
          const res = await fetch("/api/admin/policies", { credentials: "include" });
          const data = await res.json();
          setPolicyCount((data.policies || []).length);
        } catch (err) {
          console.error("Error fetching policy count:", err);
        }
      };
      fetchPolicyCount();
    }, []);

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <header className={styles.header}>
        <h1>Welcome, {admin?.userFirstName ?? "Admin"}</h1>
        <div className={styles.logoContainer}>
          <Image
            src={logo}
            alt="Logo"
            width={130}
            height={40}
            className={styles.logo}
          />
        </div>
        <button
          className={styles.menuToggle}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
        <div className={styles.desktopOnlyLogout}>
          <button className={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Area */}
      <div className={styles.mainArea}>
        <aside
          className={`${styles.sidebar} ${
            sidebarOpen ? styles.sidebarMobile : ""
          }`}
        >
          <p className={styles.sectionTitle}>Menu</p>
          <ul className={styles.menu}>
            <li
              onClick={() => {
                setActiveSection("dashboard");
                setSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${activeSection === "dashboard" ? styles.activeMenuItem : ""}`}
            >
              <span className={styles.iconLabel}>
                <FiGrid className={styles.icon} />
                <span className={styles.label}>Dashboard</span>
              </span>
            </li>
            <p className={styles.sectionTitle}>Create</p>


            <li
              onClick={() => {
                setActiveSection("createManager");
                setSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${activeSection === "createManager" ? styles.activeMenuItem : ""}`}
            >
              <span className={styles.iconLabel}>
                <FiUserCheck className={styles.icon} />
                <span className={styles.label}>Create Manager</span>
              </span>
            </li>


            <li
              onClick={() => {
                setActiveSection("createAgent");
                setSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${activeSection === "createAgent" ? styles.activeMenuItem : ""}`}
            >
              <span className={styles.iconLabel}>
                <FiBriefcase className={styles.icon} />
                <span className={styles.label}>Create Agent</span>
              </span>
            </li>
            <p className={styles.sectionTitle}>List</p>


            <li
              className={`${styles.menuItem} ${activeSection === "managerList" ? styles.activeMenuItem : ""}`}
              onClick={() => {
                setActiveSection("managerList");
                setSidebarOpen(false);
              }}>
              <span className={styles.iconLabel}>
                <FiUsers className={styles.icon} />
                <span className={styles.label}>Manager List</span>
              </span>
            </li>
            <li className={`${styles.menuItem} ${activeSection === "agentList" ? styles.activeMenuItem : ""}`}
            onClick={()=>{
              setActiveSection("agentList");
              setSidebarOpen(false);
            }}
            >
              <span className={styles.iconLabel}>
                <FiBriefcase className={styles.icon} />
                <span className={styles.label}>Agent List</span>
              </span>
            </li>
            <li
              className={`${styles.menuItem} ${activeSection === "userList" ? styles.activeMenuItem : ""}`}
              onClick={() => {
                setActiveSection("userList");
                setSidebarOpen(false);
              }}>
              <span className={styles.iconLabel}>
                <FiUser className={styles.icon} />
                <span className={styles.label}>User List</span>
              </span>
            </li>
            <p className={styles.sectionTitle}>Module</p>
            <li
              className={`${styles.menuItem} ${activeSection === "policyDashboard" ? styles.activeMenuItem : ""}`}
              onClick={() => {
                setActiveSection("policyDashboard");
                setSidebarOpen(false);
              }}
            >
              <span className={styles.iconLabel}>
                <FiFileText className={styles.icon} />
                <span className={styles.label}>Customer</span>
              </span>
            </li>

            <li
              className={`${styles.menuItem} ${activeSection === "configManagement" ? styles.activeMenuItem : ""}`}
              onClick={() => {
                setActiveSection("configManagement");
                setSidebarOpen(false);
              }}
            >
              <span className={styles.iconLabel}>
                <FiSettings className={styles.icon} />
                <span className={styles.label}>Configuration</span>
              </span>
            </li>

            <p className={styles.sectionTitle}>Security</p>
            <li
              onClick={() => {
                setActiveSection("resetpassword");
                setSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${activeSection === "resetpassword" ? styles.activeMenuItem : ""}`}
            >
              <span className={styles.iconLabel}>
                <FiKey className={styles.icon} />
                <span className={styles.label}>Reset password</span>
              </span>
            </li>

            <li
              onClick={() => {
                setActiveSection("changepassword");
                setSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${activeSection === "changepassword" ? styles.activeMenuItem : ""}`}
            >
              <span className={styles.iconLabel}>
                <FiLock className={styles.icon} />
                <span className={styles.label}>Change Password</span>
              </span>
            </li>
          </ul>

          <div className={styles.mobileOnlyLogout}>
            <button className={styles.logoutButton} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
        
             {activeSection === "dashboard" && (
            <div className={styles.dashboardCards}>
              <div className={styles.card}>
                <FiUsers size={32} className={styles.cardIcon} />
                <p className={styles.cardTitle}>Number of Admins</p>
                <p className={styles.cardValue}>{adminCount}</p>
              </div>
              <div className={styles.card}>
                <FiUserPlus size={32} className={styles.cardIcon} />
                <p className={styles.cardTitle}>State Managers</p>
                <p className={styles.cardValue}>{stateManagerCount}</p>
              </div>
              <div className={styles.card}>
                <FiUsers size={32} className={styles.cardIcon} />
                <p className={styles.cardTitle}>District Managers</p>
                <p className={styles.cardValue}>{districtManagerCount}</p>
              </div>
              <div className={styles.card}>
                <FiUserPlus size={32} className={styles.cardIcon} />
                <p className={styles.cardTitle}>Agents</p>
                <p className={styles.cardValue}>{agentCount}</p>
              </div>
              <div className={styles.card}>
                <FiFileText size={32} className={styles.cardIcon} />
                <p className={styles.cardTitle}>Policies Issued</p>
                <p className={styles.cardValue}>{policyCount}</p>
              </div>
            </div>
          )}
          {activeSection === "createAdmin" && <CreateAdmin />}
          {activeSection === "createManager" && <CreateManager />}
          {activeSection === "createAgent" && <CreateAgent />}
          {activeSection === "changepassword" && <ChangePassword />}
          {activeSection === "resetpassword" && <ResetPassword />}
          {activeSection === "userList" && <UserList />}
          {activeSection === "managerList" && <ManagerList />}
          {activeSection === "agentList" && <AgentList />}
          {activeSection === "policyDashboard" && <PolicyDashboard />}
          {activeSection === "configManagement" && <ConfigManagement />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;


