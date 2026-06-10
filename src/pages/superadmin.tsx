
import { GetServerSideProps } from "next";
import { verifyToken } from "@/utils/verifyToken";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.req.cookies["adminToken"]; // ✅ FIXED

  const data = token ? await verifyToken(token) : null;

  if (
    !data ||
    typeof data !== "object" ||
    !("role" in data) ||
    (data as any).role !== "superadmin"
  ) {
    return {
      redirect: {
        destination: "/adminlogin",
        permanent: false,
      },
    };
  }

  return {
    props: {
      adminData: data,
    },
  };
};


import React, { useEffect, useState } from "react";
import Image from "next/image";
import logo from "@/assets/logo.png";
import CreateAdmin from "@/components/superadminsidebar/createadmin";
import CreateManager from "@/components/superadminsidebar/createmanager";
import CreateAgent from "@/components/superadminsidebar/createagent";
import AdminList from "@/components/superadminsidebar/adminlist";
import UserList from "@/components/superadminsidebar/userList";
import ManagerList from "@/components/superadminsidebar/managerlist";
import AgentList from "@/components/superadminsidebar/agentlist";
import ChangePassword from "@/components/superadminsidebar/changepasswords";
import ResetPassword from "@/components/superadminsidebar/resetpassword";
import styles from "@/styles/pages/admindashboard.module.css";
import HomeSection from "@/components/superadminsidebar/mainpage";
import MarineInsuranceList from "@/components/superadminsidebar/marineinsurancelist";
import TravelInsuranceList from "@/components/superadminsidebar/travelinsurancelist";
import ShopInsuranceList from "@/components/superadminsidebar/shopinsurancelist";
import Healthinsurancelist from "@/components/superadminsidebar/Healthinsurancelist";
import Homeinsurancelist from "@/components/superadminsidebar/Homeinsurancelist";
import Doctorinsurancelist from "@/components/superadminsidebar/Doctorinsurancelist";
import Officepackagepolicylist from "@/components/superadminsidebar/Officepackagepolicylist";
import Directorlist from "@/components/superadminsidebar/Directorlist";
import ReviewApplication from "@/components/superadminsidebar/reviewapplication";
import ShowResult from "@/components/superadminsidebar/showresult";



import { useAdmin } from "@/lib/hooks/useAdmin";
import axios from "axios";

import {
  FiUsers,
  FiUserPlus,
  FiLock,
  FiList,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { useRouter } from "next/router";  // ✅ CORRECT
 // ✅ FIXED import

const SuperAdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminCount, setAdminCount] = useState(0);
  const [adminData, setAdminData] = useState<any>(null);
  const [load, setLoad] = useState(false);
  const [agentCount, setAgentCount] = useState(0);
  const [stateManagerCount, setStateManagerCount] = useState(0);
  const [districtManagerCount, setDistrictManagerCount] = useState(0);

  const router = useRouter();
  const { admin } = useAdmin();

  const handleLogout = async () => {
    try {
      await axios.post("/api/admin/logout");
      localStorage.removeItem("adminToken");
      router.replace("/adminlogin");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Admin Count
  useEffect(() => {
    const fetchAdminCount = async () => {
      try {
        const res = await fetch("/api/getadmin");
        if (!res.ok) throw new Error("Failed to fetch admins");
        const data = await res.json();
        setAdminCount(data.length || 0);
      } catch (err) {
        console.error("Error fetching admin count:", err);
      }
    };
    fetchAdminCount();
  }, []);

  // Agent Count
  useEffect(() => {
    const fetchAgentCount = async () => {
      try {
        const res = await fetch("/api/getallagents");
        if (!res.ok) throw new Error("Failed to fetch agents");
        const data = await res.json();
        setAgentCount(data.length || 0);
      } catch (err) {
        console.error("Error fetching agent count:", err);
      }
    };
    fetchAgentCount();
  }, []);

  // ✅ Manager Counts
  useEffect(() => {
    const fetchManagerCounts = async () => {
      try {
        const res = await fetch("/api/getallmanagers");
        if (!res.ok) throw new Error("Failed to fetch managers");
        const managers = await res.json();

        setStateManagerCount(
          managers.filter((m: { category: string }) => m.category === "state")
            .length
        );
        setDistrictManagerCount(
          managers.filter(
            (m: { category: string }) => m.category === "district"
          ).length
        );
      } catch (err) {
        console.error("Error fetching managers:", err);
      }
    };
    fetchManagerCounts();
  }, []);

  // ✅ Profile edit fetch
  useEffect(() => {
    if (activeSection === "profileEdit") {
      setLoad(true);
      axios
        .get("/api/admin/getadmindetails", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        })
        .then((res) => setAdminData(res.data))
        .catch((err) => console.error("Error fetching admin:", err))
        .finally(() => setLoad(false));
    }
  }, [activeSection]);

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <header className={styles.header}>
        <h1>Welcome, {admin?.userFirstName ?? "SuperAdmin"}</h1>
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

      {/* Main Areas */}
      <div className={styles.mainArea}>
        {/* Sidebar */}
        <aside
          className={`${styles.sidebar} ${
            sidebarOpen ? styles.sidebarMobile : ""
          }`}
        >
          <p className={styles.sectionTitle}>Menu</p>
          <ul className={styles.menu}>
            {/* Dashboard */}
            <li
              onClick={() => {
                setActiveSection("dashboard");
                setSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${
                activeSection === "dashboard" ? styles.activeMenu : ""
              }`}
            >
              <span className={styles.iconLabel}>
                <FiUsers className={styles.icon} />
                <span className={styles.label}>Dashboard</span>
              </span>
            </li>

            {/* Create */}
            <p className={styles.sectionTitle}>Create</p>
            <li
              onClick={() => {
                setActiveSection("createAdmin");
                setSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${
                activeSection === "createAdmin" ? styles.activeMenu : ""
              }`}
            >
              <span className={styles.iconLabel}>
                <FiUserPlus className={styles.icon} />
                <span className={styles.label}>Create Admin</span>
              </span>
            </li>
            <li
              onClick={() => {
                setActiveSection("createManager");
                setSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${
                activeSection === "createManager" ? styles.activeMenu : ""
              }`}
            >
              <span className={styles.iconLabel}>
                <FiUserPlus className={styles.icon} />
                <span className={styles.label}>Create Manager</span>
              </span>
            </li>
            {/* <li
              onClick={() => {
                setActiveSection("createAgent");
                setSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${
                activeSection === "createAgent" ? styles.activeMenu : ""
              }`}
            >
              <span className={styles.iconLabel}>
                <FiUserPlus className={styles.icon} />
                <span className={styles.label}>Create Agent</span>
              </span>
            </li> */}

            {/* Lists */}
            <p className={styles.sectionTitle}>List</p>
            <li
              className={`${styles.menuItem} ${
                activeSection === "adminlist" ? styles.activeMenu : ""
              }`}
              onClick={() => {
                setActiveSection("adminlist");
                setSidebarOpen(false);
              }}
            >
              <span className={styles.iconLabel}>
                <FiList className={styles.icon} />
                <span className={styles.label}>Admin List</span>
              </span>
            </li>
            <li
              className={`${styles.menuItem} ${
                activeSection === "managerlist" ? styles.activeMenu : ""
              }`}
              onClick={() => {
                setActiveSection("managerlist");
                setSidebarOpen(false);
              }}
            >
              <span className={styles.iconLabel}>
                <FiList className={styles.icon} />
                <span className={styles.label}>Manager List</span>
              </span>
            </li>
            <li
              className={`${styles.menuItem} ${
                activeSection === "agentlist" ? styles.activeMenu : ""
              }`}
              onClick={() => {
                setActiveSection("agentlist");
                setSidebarOpen(false);
              }}
            >
              <span className={styles.iconLabel}>
                <FiList className={styles.icon} />
                <span className={styles.label}>Agent List</span>
              </span>
            </li>
            <li
              className={`${styles.menuItem} ${
                activeSection === "userList" ? styles.activeMenu : ""
              }`}
              onClick={() => {
                setActiveSection("userList");
                setSidebarOpen(false);
              }}
            >
              <span className={styles.iconLabel}>
                <FiList className={styles.icon} />
                <span className={styles.label}>User List</span>
              </span>
            </li>

            {/* Security */}
            <p className={styles.sectionTitle}>Security</p>
            <li
              onClick={() => {
                setActiveSection("resetpassword");
                setSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${
                activeSection === "resetpassword" ? styles.activeMenu : ""
              }`}
            >
              <span className={styles.iconLabel}>
                <FiLock className={styles.icon} />
                <span className={styles.label}>Reset Password</span>
              </span>
            </li>
            <li
              onClick={() => {
                setActiveSection("changepassword");
                setSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${
                activeSection === "changepassword" ? styles.activeMenu : ""
              }`}
            >
              <span className={styles.iconLabel}>
                <FiLock className={styles.icon} />
                <span className={styles.label}>Change Password</span>
              </span>
            </li>

            {/* Profile */}
            <p className={styles.sectionTitle}>Profile</p>
            <li
              onClick={() => setActiveSection("profileEdit")}
              className={`${styles.menuItem} ${
                activeSection === "profileEdit" ? styles.activeMenu : ""
              }`}
            >
              <span className={styles.iconLabel}>
                <FiLock className={styles.icon} />
                <span className={styles.label}>Your Profile Edit</span>
              </span>
            </li>

            {/* Home */}
            <p className={styles.sectionTitle}>Home</p>
            <li
              onClick={() => {
                setActiveSection("homeSection");
                if (window.innerWidth <= 768) {
                  setSidebarOpen(false);
                }
              }}
              className={`${styles.menuItem} ${
                activeSection === "homeSection" ? styles.activeMenu : ""
              }`}
            >
              <span className={styles.iconLabel}>
                <FiLock className={styles.icon} />
                <span className={styles.label}>Home Section</span>
              </span>
            </li>
            <li
  onClick={() => setActiveSection("reviewApplication")}
  className={`${styles.menuItem} ${
    activeSection === "reviewApplication" ? styles.activeMenu : ""
  }`}
>
  <span className={styles.iconLabel}>
    <FiList className={styles.icon} />
    <span className={styles.label}>Review Application</span>
  </span>
</li>
  <li
  onClick={() => setActiveSection("showResult")}
  className={`${styles.menuItem} ${
    activeSection === "showResult" ? styles.activeMenu : ""
  }`}
>
  <span className={styles.iconLabel}>
    <FiList className={styles.icon} />
    <span className={styles.label}>POS Certificate</span>
  </span>
</li>

            {/* Module*/}
            <p className={styles.sectionTitle}>Module</p>
            <li
              onClick={() => setActiveSection("marineinsurancelist")}
              className={`${styles.menuItem} ${
                activeSection === "marineinsurancelist" ? styles.activeMenu : ""
              }`}
            >
              <FiList className={styles.icon} />
              <span>Marine Insurance</span>
            </li>
            <li
              onClick={() => setActiveSection("travelinsurancelist")}
              className={`${styles.menuItem} ${
                activeSection === "travelinsurancelist" ? styles.activeMenu : ""
              }`}
            >
              <FiList className={styles.icon} />
              <span>Travel Insurance</span>
            </li>
            <li
              onClick={() => setActiveSection("shopinsurancelist")}
              className={`${styles.menuItem} ${
                activeSection === "shopinsurancelist" ? styles.activeMenu : ""
              }`}
            >
              <FiList className={styles.icon} />
              <span>Shop Insurance</span>
            </li>
             <li
              onClick={() => setActiveSection("healthinsurancelist")}
              className={`${styles.menuItem} ${
                activeSection === "healthinsurancelist" ? styles.activeMenu : ""
              }`}
            >
              <FiList className={styles.icon} />
              <span>Health Insurance</span>
            </li>
            <li
              onClick={() => setActiveSection("homeinsurancelist")}
              className={`${styles.menuItem} ${
                activeSection === "homeinsurancelist" ? styles.activeMenu : ""
              }`}
            >
              <FiList className={styles.icon} />
              <span>Home Insurance</span>
            </li>
              <li
              onClick={() => setActiveSection("doctorinsurancelist")}
              className={`${styles.menuItem} ${
                activeSection === "doctorinsurancelist" ? styles.activeMenu : ""
              }`}
            >
              <FiList className={styles.icon} />
              <span>Doctor Insurance</span>
            </li>
             <li
              onClick={() => setActiveSection("officepackagepolicylist")}
              className={`${styles.menuItem} ${
                activeSection === "officepackagepolicylist" ? styles.activeMenu : ""
              }`}
            >
              <FiList className={styles.icon} />
              <span>officepackagepolicy</span>  
            </li>
              <li
              onClick={() => setActiveSection("directorlist")}
              className={`${styles.menuItem} ${
                activeSection === "directorlist" ? styles.activeMenu : ""
              }`}
            >
              <FiList className={styles.icon} />
              <span>Director&OfficerLiability</span>
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
            </div>
          )}

          {activeSection === "createAdmin" && <CreateAdmin mode="create" />}
          {activeSection === "createManager" && <CreateManager />}
          {activeSection === "createAgent" && <CreateAgent />}
          {activeSection === "changepassword" && <ChangePassword />}
          {activeSection === "resetpassword" && <ResetPassword />}
          {activeSection === "adminlist" && <AdminList />}
          {activeSection === "managerlist" && <ManagerList />}
          {activeSection === "agentlist" && <AgentList />}
          {activeSection === "userList" && <UserList />}
          {activeSection === "profileEdit" && (
            <CreateAdmin initialData={adminData} mode="edit" />
          )}
          {activeSection === "homeSection" && <HomeSection />}
          {activeSection === "marineinsurancelist" && <MarineInsuranceList />}
          {activeSection === "travelinsurancelist" && <TravelInsuranceList />}
{activeSection === "shopinsurancelist" && <ShopInsuranceList />}
{activeSection === "shopinsurancelist" && <ShopInsuranceList />}
{activeSection === "healthinsurancelist" && <Healthinsurancelist />}
{activeSection === "homeinsurancelist" && <Homeinsurancelist />}
{activeSection === "doctorinsurancelist" && <Doctorinsurancelist />}
{activeSection === "officepackagepolicylist" && <Officepackagepolicylist />}
{activeSection === "directorlist" && <Directorlist />}
{activeSection === "reviewApplication" && <ReviewApplication />}
{activeSection === "showResult" && <ShowResult />}


        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
