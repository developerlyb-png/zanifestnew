"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import logo from "@/assets/logowhite.png";
import CreateAdmin from "@/components/superadminsidebar/createadmin";
import { ProfileMenu } from "@/components/superadminsidebar/ProfileMenu";
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
  FiMenu,
  FiX,
  FiGrid,
  FiUserCheck,
  FiBriefcase,
  FiUser,
  FiFileText,
  FiSettings,
  FiChevronDown,
} from "react-icons/fi";
import axios from "axios";

// Which collapsible sidebar group a given section belongs to — mirrors the
// same pattern superadmin.tsx uses (SIDEBAR_GROUP_OF) so navigating directly
// into a section (e.g. via the profile dropdown, or a future deep link)
// auto-opens its group instead of leaving it looking collapsed.
const SIDEBAR_GROUP_OF: Record<string, string> = {
  createManager: "create",
  createAgent: "create",
  managerList: "lists",
  agentList: "lists",
  userList: "lists",
};

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
   const [adminCount, setAdminCount] = useState(0);
    const [agentCount, setAgentCount] = useState(0);
    const [stateManagerCount, setStateManagerCount] = useState(0);
    const [districtManagerCount, setDistrictManagerCount] = useState(0);
    const [policyCount, setPolicyCount] = useState(0);
    const [adminData, setAdminData] = useState<any>(null);
    const [profileLoading, setProfileLoading] = useState(false);
const router = useRouter();


   const { admin, loading } = useAdmin();
   console.log("Admin data:", admin?.userFirstName);

     const adminName = typeof window !== "undefined" ? localStorage.getItem("adminName") : null;

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const group = SIDEBAR_GROUP_OF[activeSection];
    if (group) {
      setOpenSections((prev) => (prev[group] ? prev : { ...prev, [group]: true }));
    }
  }, [activeSection]);


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

    useEffect(() => {
      if (activeSection === "profileEdit") {
        setProfileLoading(true);
        axios
          .get("/api/admin/getadmindetails", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
          })
          .then((res) => setAdminData(res.data))
          .catch((err) => console.error("Error fetching admin:", err))
          .finally(() => setProfileLoading(false));
      }
    }, [activeSection]);

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <header className={styles.header}>
        <button
          type="button"
          className={styles.menuToggle}
          onClick={() => {
            if (typeof window !== "undefined" && window.innerWidth <= 768) {
              setSidebarOpen(!sidebarOpen);
            } else {
              setSidebarCollapsed(!sidebarCollapsed);
            }
          }}
        >
          {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
        <div className={styles.headerBrand}>
          <Image
            src={logo}
            alt="Zanifest"
            width={118}
            height={30}
            className={styles.headerLogo}
          />
          <span className={styles.headerBrandSub}>Admin Panel</span>
        </div>
        <div className={styles.headerSpacer} />
        <div className={styles.desktopOnlyLogout}>
          <ProfileMenu admin={admin} onNavigate={setActiveSection} onLogout={handleLogout} />
        </div>
      </header>

      {/* Main Area */}
      <div className={styles.mainArea}>
        <aside
          className={`${styles.sidebar} ${
            sidebarOpen ? styles.sidebarMobile : ""
          } ${sidebarCollapsed ? styles.sidebarCollapsed : ""}`}
        >
          <div className={styles.sidebarGreeting}>
            <span className={styles.sidebarGreetingName}>
              Welcome, {admin?.userFirstName ?? "Admin"}
            </span>
            <span className={styles.sidebarGreetingDate}>{todayLabel}</span>
          </div>
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

            {/* Create */}
            <button
              type="button"
              className={`${styles.sectionToggle} ${openSections.create ? styles.sectionToggleOpen : ""}`}
              onClick={() => toggleSection("create")}
            >
              <span className={styles.iconLabel}>
                <FiUserPlus className={styles.icon} />
                <span className={`${styles.label} ${styles.sectionToggleLabel}`}>Create</span>
              </span>
              <FiChevronDown
                className={`${styles.sectionChevron} ${openSections.create ? styles.sectionChevronOpen : ""}`}
              />
            </button>
            {openSections.create && (
              <>
                <li
                  onClick={() => {
                    setActiveSection("createManager");
                    setSidebarOpen(false);
                  }}
                  className={`${styles.menuItem} ${styles.subMenuItem} ${activeSection === "createManager" ? styles.activeMenu : ""}`}
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
                  className={`${styles.menuItem} ${styles.subMenuItem} ${activeSection === "createAgent" ? styles.activeMenu : ""}`}
                >
                  <span className={styles.iconLabel}>
                    <FiBriefcase className={styles.icon} />
                    <span className={styles.label}>Create Agent</span>
                  </span>
                </li>
              </>
            )}

            {/* Lists */}
            <button
              type="button"
              className={`${styles.sectionToggle} ${openSections.lists ? styles.sectionToggleOpen : ""}`}
              onClick={() => toggleSection("lists")}
            >
              <span className={styles.iconLabel}>
                <FiUsers className={styles.icon} />
                <span className={`${styles.label} ${styles.sectionToggleLabel}`}>Lists</span>
              </span>
              <FiChevronDown
                className={`${styles.sectionChevron} ${openSections.lists ? styles.sectionChevronOpen : ""}`}
              />
            </button>
            {openSections.lists && (
              <>
                <li
                  className={`${styles.menuItem} ${styles.subMenuItem} ${activeSection === "managerList" ? styles.activeMenu : ""}`}
                  onClick={() => {
                    setActiveSection("managerList");
                    setSidebarOpen(false);
                  }}>
                  <span className={styles.iconLabel}>
                    <FiUsers className={styles.icon} />
                    <span className={styles.label}>Manager List</span>
                  </span>
                </li>
                <li className={`${styles.menuItem} ${styles.subMenuItem} ${activeSection === "agentList" ? styles.activeMenu : ""}`}
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
                  className={`${styles.menuItem} ${styles.subMenuItem} ${activeSection === "userList" ? styles.activeMenu : ""}`}
                  onClick={() => {
                    setActiveSection("userList");
                    setSidebarOpen(false);
                  }}>
                  <span className={styles.iconLabel}>
                    <FiUser className={styles.icon} />
                    <span className={styles.label}>User List</span>
                  </span>
                </li>
              </>
            )}

            {/* Modules — standalone, like Dashboard */}
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
          </ul>

          <div className={styles.mobileOnlyLogout}>
            <ProfileMenu
              admin={admin}
              onNavigate={(section) => {
                setActiveSection(section);
                setSidebarOpen(false);
              }}
              onLogout={handleLogout}
            />
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
          {activeSection === "profileEdit" && (
            <CreateAdmin initialData={adminData} mode="edit" />
          )}
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


