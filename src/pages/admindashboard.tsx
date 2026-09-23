"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import logo from "@/assets/logowhite.png";
import CreateAdmin from "@/components/superadminsidebar/createadmin";
import { ProfileMenu } from "@/components/superadminsidebar/ProfileMenu";
import AgentList from "@/components/superadminsidebar/agentlist";
import ManagerList from "@/components/superadminsidebar/managerlist";
import UserList from "@/components/superadminsidebar/userList";
import ChangePassword from "@/components/superadminsidebar/changepasswords";
import ResetPassword from "@/components/superadminsidebar/resetpassword";
import PolicyDashboard from "@/components/superadminsidebar/PolicyDashboard";
import PolicyRenewals from "@/components/superadminsidebar/PolicyRenewals";
import ConfigManagement from "@/components/superadminsidebar/ConfigManagement";
import MarineInsuranceList from "@/components/superadminsidebar/marineinsurancelist";
import TravelInsuranceList from "@/components/superadminsidebar/travelinsurancelist";
import ShopInsuranceList from "@/components/superadminsidebar/shopinsurancelist";
import Healthinsurancelist from "@/components/superadminsidebar/Healthinsurancelist";
import Homeinsurancelist from "@/components/superadminsidebar/Homeinsurancelist";
import Doctorinsurancelist from "@/components/superadminsidebar/Doctorinsurancelist";
import Officepackagepolicylist from "@/components/superadminsidebar/Officepackagepolicylist";
import Directorlist from "@/components/superadminsidebar/Directorlist";
import ReviewApplication from "@/components/superadminsidebar/reviewapplication";
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
  FiBriefcase,
  FiUser,
  FiFileText,
  FiSettings,
  FiChevronDown,
  FiTarget,
  FiLayers,
  FiAnchor,
  FiMap,
  FiShoppingBag,
  FiHeart,
  FiHome,
  FiActivity,
  FiPackage,
  FiBookOpen,
  FiClipboard,
  FiRefreshCw,
} from "react-icons/fi";
import axios from "axios";

// Which collapsible sidebar group a given section belongs to — mirrors the
// same pattern superadmin.tsx uses (SIDEBAR_GROUP_OF) so navigating directly
// into a section (e.g. via the profile dropdown, or a future deep link)
// auto-opens its group instead of leaving it looking collapsed.
const SIDEBAR_GROUP_OF: Record<string, string> = {
  managerList: "lists",
  userList: "lists",
  marineinsurancelist: "leads",
  travelinsurancelist: "leads",
  shopinsurancelist: "leads",
  healthinsurancelist: "leads",
  homeinsurancelist: "leads",
  doctorinsurancelist: "leads",
  officepackagepolicylist: "leads",
  directorlist: "leads",
  agentList: "posp",
  reviewApplication: "posp",
};

const statusTone = (status?: string) => {
  const s = (status || "").toLowerCase();
  if (s === "active" || s === "issued") return "active";
  if (s === "draft" || s === "pending") return "draft";
  if (s === "expired" || s === "cancelled") return "danger";
  return "other";
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
    const [policies, setPolicies] = useState<any[]>([]);
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
      const fetchPolicies = async () => {
        try {
          const res = await fetch("/api/admin/policies", { credentials: "include" });
          const data = await res.json();
          setPolicies(data.policies || []);
          setPolicyCount((data.policies || []).length);
        } catch (err) {
          console.error("Error fetching policies:", err);
        }
      };
      fetchPolicies();
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

  const recentPolicies = policies.slice(0, 5);

  const statusBuckets = policies.reduce(
    (acc: { active: number; draft: number; other: number }, p: any) => {
      const tone = statusTone(p.status);
      const key = tone === "active" ? "active" : tone === "draft" ? "draft" : "other";
      acc[key] += 1;
      return acc;
    },
    { active: 0, draft: 0, other: 0 }
  );

  const totalForPct = policies.length || 1;
  const activePct = Math.round((statusBuckets.active / totalForPct) * 100);
  const draftPct = Math.round((statusBuckets.draft / totalForPct) * 100);
  const otherPct = Math.max(0, 100 - activePct - draftPct);

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

            {/* Leads */}
            <button
              type="button"
              className={`${styles.sectionToggle} ${openSections.leads ? styles.sectionToggleOpen : ""}`}
              onClick={() => toggleSection("leads")}
            >
              <span className={styles.iconLabel}>
                <FiTarget className={styles.icon} />
                <span className={`${styles.label} ${styles.sectionToggleLabel}`}>Leads</span>
              </span>
              <FiChevronDown
                className={`${styles.sectionChevron} ${openSections.leads ? styles.sectionChevronOpen : ""}`}
              />
            </button>
            {openSections.leads && (
              <>
                <li
                  className={`${styles.menuItem} ${styles.subMenuItem} ${activeSection === "marineinsurancelist" ? styles.activeMenu : ""}`}
                  onClick={() => setActiveSection("marineinsurancelist")}
                >
                  <span className={styles.iconLabel}>
                    <FiAnchor className={styles.icon} />
                    <span className={styles.label}>Marine Insurance</span>
                  </span>
                </li>
                <li
                  className={`${styles.menuItem} ${styles.subMenuItem} ${activeSection === "travelinsurancelist" ? styles.activeMenu : ""}`}
                  onClick={() => setActiveSection("travelinsurancelist")}
                >
                  <span className={styles.iconLabel}>
                    <FiMap className={styles.icon} />
                    <span className={styles.label}>Travel Insurance</span>
                  </span>
                </li>
                <li
                  className={`${styles.menuItem} ${styles.subMenuItem} ${activeSection === "shopinsurancelist" ? styles.activeMenu : ""}`}
                  onClick={() => setActiveSection("shopinsurancelist")}
                >
                  <span className={styles.iconLabel}>
                    <FiShoppingBag className={styles.icon} />
                    <span className={styles.label}>Shop Insurance</span>
                  </span>
                </li>
                <li
                  className={`${styles.menuItem} ${styles.subMenuItem} ${activeSection === "healthinsurancelist" ? styles.activeMenu : ""}`}
                  onClick={() => setActiveSection("healthinsurancelist")}
                >
                  <span className={styles.iconLabel}>
                    <FiHeart className={styles.icon} />
                    <span className={styles.label}>Health Insurance</span>
                  </span>
                </li>
                <li
                  className={`${styles.menuItem} ${styles.subMenuItem} ${activeSection === "homeinsurancelist" ? styles.activeMenu : ""}`}
                  onClick={() => setActiveSection("homeinsurancelist")}
                >
                  <span className={styles.iconLabel}>
                    <FiHome className={styles.icon} />
                    <span className={styles.label}>Home Insurance</span>
                  </span>
                </li>
                <li
                  className={`${styles.menuItem} ${styles.subMenuItem} ${activeSection === "doctorinsurancelist" ? styles.activeMenu : ""}`}
                  onClick={() => setActiveSection("doctorinsurancelist")}
                >
                  <span className={styles.iconLabel}>
                    <FiActivity className={styles.icon} />
                    <span className={styles.label}>Doctor Insurance</span>
                  </span>
                </li>
                <li
                  className={`${styles.menuItem} ${styles.subMenuItem} ${activeSection === "officepackagepolicylist" ? styles.activeMenu : ""}`}
                  onClick={() => setActiveSection("officepackagepolicylist")}
                >
                  <span className={styles.iconLabel}>
                    <FiPackage className={styles.icon} />
                    <span className={styles.label}>Office Package Policy</span>
                  </span>
                </li>
                <li
                  className={`${styles.menuItem} ${styles.subMenuItem} ${activeSection === "directorlist" ? styles.activeMenu : ""}`}
                  onClick={() => setActiveSection("directorlist")}
                >
                  <span className={styles.iconLabel}>
                    <FiBookOpen className={styles.icon} />
                    <span className={styles.label}>Director Officer Liability</span>
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
              className={`${styles.menuItem} ${activeSection === "policyRenewals" ? styles.activeMenuItem : ""}`}
              onClick={() => {
                setActiveSection("policyRenewals");
                setSidebarOpen(false);
              }}
            >
              <span className={styles.iconLabel}>
                <FiRefreshCw className={styles.icon} />
                <span className={styles.label}>Policy Renewals</span>
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

            {/* POSP */}
            <button
              type="button"
              className={`${styles.sectionToggle} ${openSections.posp ? styles.sectionToggleOpen : ""}`}
              onClick={() => toggleSection("posp")}
            >
              <span className={styles.iconLabel}>
                <FiLayers className={styles.icon} />
                <span className={`${styles.label} ${styles.sectionToggleLabel}`}>POSP</span>
              </span>
              <FiChevronDown
                className={`${styles.sectionChevron} ${openSections.posp ? styles.sectionChevronOpen : ""}`}
              />
            </button>
            {openSections.posp && (
              <>
                {/* Agents — hidden from the sidebar now that POSP Management
                    (Assigned To / Lifetime Sales / Status / Delete / +Add Agent)
                    covers everything this list did. Feature kept intact. */}
                {false && (
                  <li
                    className={`${styles.menuItem} ${styles.subMenuItem} ${activeSection === "agentList" ? styles.activeMenu : ""}`}
                    onClick={() => {
                      setActiveSection("agentList");
                      setSidebarOpen(false);
                    }}
                  >
                    <span className={styles.iconLabel}>
                      <FiBriefcase className={styles.icon} />
                      <span className={styles.label}>Agents</span>
                    </span>
                  </li>
                )}
                <li
                  className={`${styles.menuItem} ${styles.subMenuItem} ${activeSection === "reviewApplication" ? styles.activeMenu : ""}`}
                  onClick={() => setActiveSection("reviewApplication")}
                >
                  <span className={styles.iconLabel}>
                    <FiClipboard className={styles.icon} />
                    <span className={styles.label}>Review Application</span>
                  </span>
                </li>
              </>
            )}
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
            <>
            <div className={styles.dashboardCards}>
              <div className={styles.card}>
                <div className={styles.cardTopRow}>
                  <span className={styles.cardIconBadge}>
                    <FiUsers size={16} />
                  </span>
                  <span className={styles.cardLabel}>Number of Admins</span>
                </div>
                <p className={styles.cardValue}>{adminCount}</p>
                <div className={styles.cardBottomRow}>
                  <span className={styles.cardSubLabel}>All admin accounts</span>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTopRow}>
                  <span className={styles.cardIconBadge}>
                    <FiUserPlus size={16} />
                  </span>
                  <span className={styles.cardLabel}>State Managers</span>
                </div>
                <p className={styles.cardValue}>{stateManagerCount}</p>
                <div className={styles.cardBottomRow}>
                  <span className={styles.cardSubLabel}>Regional heads</span>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTopRow}>
                  <span className={styles.cardIconBadge}>
                    <FiUsers size={16} />
                  </span>
                  <span className={styles.cardLabel}>District Managers</span>
                </div>
                <p className={styles.cardValue}>{districtManagerCount}</p>
                <div className={styles.cardBottomRow}>
                  <span className={styles.cardSubLabel}>Local heads</span>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTopRow}>
                  <span className={styles.cardIconBadge}>
                    <FiUserPlus size={16} />
                  </span>
                  <span className={styles.cardLabel}>Agents</span>
                </div>
                <p className={styles.cardValue}>{agentCount}</p>
                <div className={styles.cardBottomRow}>
                  <span className={styles.cardSubLabel}>Active field agents</span>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTopRow}>
                  <span className={styles.cardIconBadge}>
                    <FiFileText size={16} />
                  </span>
                  <span className={styles.cardLabel}>Policies Issued</span>
                </div>
                <p className={styles.cardValue}>{policyCount}</p>
                <div className={styles.cardBottomRow}>
                  <span className={styles.cardSubLabel}>All time total</span>
                </div>
              </div>
            </div>

            <div className={styles.dashboardGrid}>
              {/* Recent Policies */}
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <h3 className={styles.panelTitle}>Recent Policies</h3>
                </div>
                {recentPolicies.length === 0 ? (
                  <p className={styles.panelEmpty}>No policies yet.</p>
                ) : (
                  <div className={styles.tableScroll}>
                    <table className={styles.recentTable}>
                      <thead>
                        <tr>
                          <th>Insured Name</th>
                          <th>Insurer</th>
                          <th>Premium</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentPolicies.map((p) => (
                          <tr key={p._id}>
                            <td>{p.customer?.fullName || "—"}</td>
                            <td>{p.insurer || "—"}</td>
                            <td>
                              {p.premium
                                ? `₹${Math.round(p.premium).toLocaleString("en-IN")}`
                                : "—"}
                            </td>
                            <td>
                              <span
                                className={`${styles.statusBadge} ${
                                  styles[`statusTone_${statusTone(p.status)}`]
                                }`}
                              >
                                {p.status || "—"}
                              </span>
                            </td>
                            <td>
                              {p.createdAt
                                ? new Date(p.createdAt).toLocaleDateString("en-GB")
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <button
                  type="button"
                  className={styles.viewAllLink}
                  onClick={() => setActiveSection("policyDashboard")}
                >
                  View All Policies →
                </button>
              </div>

              {/* Side panels */}
              <div className={styles.sidePanels}>
                <div className={styles.panelCard}>
                  <h3 className={styles.panelTitle}>Policy Status</h3>
                  <p className={styles.statusBigPct}>
                    {activePct}% <span>Active</span>
                  </p>
                  <div className={styles.statusBar}>
                    <span className={styles.statusSegActive} style={{ width: `${activePct}%` }} />
                    <span className={styles.statusSegDraft} style={{ width: `${draftPct}%` }} />
                    <span className={styles.statusSegOther} style={{ width: `${otherPct}%` }} />
                  </div>
                  <div className={styles.statTileRow}>
                    <div className={styles.statTile}>
                      <span className={styles.statTileValue}>{statusBuckets.active}</span>
                      <span className={styles.statTileLabel}>Active</span>
                    </div>
                    <div className={styles.statTile}>
                      <span className={styles.statTileValue}>{statusBuckets.draft}</span>
                      <span className={styles.statTileLabel}>Draft</span>
                    </div>
                    <div className={styles.statTile}>
                      <span className={styles.statTileValue}>{statusBuckets.other}</span>
                      <span className={styles.statTileLabel}>Other</span>
                    </div>
                  </div>
                </div>

                <div className={styles.quickActionsCard}>
                  <h3 className={styles.quickActionsTitle}>Add a new policy</h3>
                  <p className={styles.quickActionsText}>
                    Create a policy manually or bulk upload from Excel/CSV.
                  </p>
                  <button
                    type="button"
                    className={styles.quickActionsBtn}
                    onClick={() => setActiveSection("policyDashboard")}
                  >
                    Go to Policy Data →
                  </button>
                </div>
              </div>
            </div>
            </>
          )}
          {activeSection === "createAdmin" && <CreateAdmin />}
          {activeSection === "profileEdit" && (
            <CreateAdmin initialData={adminData} mode="edit" />
          )}
          {activeSection === "changepassword" && <ChangePassword />}
          {activeSection === "resetpassword" && <ResetPassword />}
          {activeSection === "userList" && <UserList />}
          {activeSection === "managerList" && <ManagerList />}
          {activeSection === "agentList" && <AgentList />}
          {activeSection === "policyDashboard" && <PolicyDashboard />}
          {activeSection === "policyRenewals" && <PolicyRenewals />}
          {activeSection === "configManagement" && <ConfigManagement />}
          {activeSection === "marineinsurancelist" && <MarineInsuranceList />}
          {activeSection === "travelinsurancelist" && <TravelInsuranceList />}
          {activeSection === "shopinsurancelist" && <ShopInsuranceList />}
          {activeSection === "healthinsurancelist" && <Healthinsurancelist />}
          {activeSection === "homeinsurancelist" && <Homeinsurancelist />}
          {activeSection === "doctorinsurancelist" && <Doctorinsurancelist />}
          {activeSection === "officepackagepolicylist" && <Officepackagepolicylist />}
          {activeSection === "directorlist" && <Directorlist />}
          {activeSection === "reviewApplication" && <ReviewApplication />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;


