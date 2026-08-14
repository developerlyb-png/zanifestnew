
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


import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import logo from "@/assets/logowhite.png";
import CreateAdmin from "@/components/superadminsidebar/createadmin";
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
import PolicyDashboard from "@/components/superadminsidebar/PolicyDashboard";



import { useAdmin } from "@/lib/hooks/useAdmin";
import axios from "axios";

import {
  FiUsers,
  FiUserPlus,
  FiLock,
  FiMenu,
  FiX,
  FiGrid,
  FiShield,
  FiUser,
  FiBriefcase,
  FiKey,
  FiEdit3,
  FiSettings,
  FiClipboard,
  FiAward,
  FiFileText,
  FiAnchor,
  FiMap,
  FiShoppingBag,
  FiHeart,
  FiHome,
  FiActivity,
  FiPackage,
  FiBookOpen,
  FiLogOut,
  FiChevronDown,
} from "react-icons/fi";
import { useRouter } from "next/router";  // ✅ CORRECT
 // ✅ FIXED import

const statusTone = (status?: string) => {
  const s = (status || "").toLowerCase();
  if (s === "active" || s === "issued") return "active";
  if (s === "draft" || s === "pending") return "draft";
  if (s === "expired" || s === "cancelled") return "danger";
  return "other";
};

type ProfileMenuAdmin = {
  userFirstName?: string;
  userLastName?: string;
  email?: string;
} | null;

const ProfileMenu = ({
  admin,
  onNavigate,
  onLogout,
}: {
  admin: ProfileMenuAdmin;
  onNavigate: (section: string) => void;
  onLogout: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = `${(admin?.userFirstName || "A").charAt(0)}${(
    admin?.userLastName || ""
  ).charAt(0)}`.toUpperCase();

  const go = (section: string) => {
    onNavigate(section);
    setOpen(false);
  };

  return (
    <div className={styles.profileMenuWrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.profileTrigger}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.profileAvatar}>{initials}</span>
        <FiChevronDown
          size={14}
          className={`${styles.profileChevron} ${open ? styles.profileChevronOpen : ""}`}
        />
      </button>

      {open && (
        <div className={styles.profileDropdown}>
          <div className={styles.profileDropdownHeader}>
            <span className={styles.profileAvatar}>{initials}</span>
            <div className={styles.profileDropdownIdentity}>
              <span className={styles.profileDropdownName}>
                {admin?.userFirstName ?? "SuperAdmin"} {admin?.userLastName ?? ""}
              </span>
              {admin?.email && (
                <span className={styles.profileDropdownEmail}>{admin.email}</span>
              )}
            </div>
          </div>

          <div className={styles.profileDropdownDivider} />

          <button type="button" className={styles.profileDropdownItem} onClick={() => go("profileEdit")}>
            <span className={styles.profileItemIcon}><FiEdit3 size={15} /></span>
            <span className={styles.profileItemLabel}>Edit Profile</span>
          </button>
          <button type="button" className={styles.profileDropdownItem} onClick={() => go("changepassword")}>
            <span className={styles.profileItemIcon}><FiLock size={15} /></span>
            <span className={styles.profileItemLabel}>Change Password</span>
          </button>
          <button type="button" className={styles.profileDropdownItem} onClick={() => go("resetpassword")}>
            <span className={styles.profileItemIcon}><FiKey size={15} /></span>
            <span className={styles.profileItemLabel}>Reset Password</span>
          </button>

          <div className={styles.profileDropdownDivider} />

          <button
            type="button"
            className={`${styles.profileDropdownItem} ${styles.profileDropdownLogout}`}
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <span className={styles.profileItemIcon}><FiLogOut size={15} /></span>
            <span className={styles.profileItemLabel}>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

const SuperAdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminCount, setAdminCount] = useState(0);
  const [adminData, setAdminData] = useState<any>(null);
  const [load, setLoad] = useState(false);
  const [agentCount, setAgentCount] = useState(0);
  const [stateManagerCount, setStateManagerCount] = useState(0);
  const [districtManagerCount, setDistrictManagerCount] = useState(0);
  const [policies, setPolicies] = useState<any[]>([]);

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

  // Policies (drives the policy count card + the recent-policies/status widgets below)
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await fetch("/api/admin/policies", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch policies");
        const data = await res.json();
        setPolicies(data.policies || []);
      } catch (err) {
        console.error("Error fetching policies:", err);
      }
    };
    fetchPolicies();
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

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
          onClick={() => setSidebarOpen(!sidebarOpen)}
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
          <span className={styles.headerBrandSub}>Superadmin Panel</span>
        </div>
        <div className={styles.headerSpacer} />
        <div className={styles.desktopOnlyLogout}>
          <ProfileMenu admin={admin} onNavigate={setActiveSection} onLogout={handleLogout} />
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
          <div className={styles.sidebarGreeting}>
            <span className={styles.sidebarGreetingName}>
              Welcome, {admin?.userFirstName ?? "SuperAdmin"}
            </span>
            <span className={styles.sidebarGreetingDate}>{todayLabel}</span>
          </div>
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
                <FiGrid className={styles.icon} />
                <span className={styles.label}>Dashboard</span>
              </span>
            </li>

            {/* Leads */}
            <p className={styles.sectionTitle}>Leads</p>
            <li
              className={`${styles.menuItem} ${
                activeSection === "marineinsurancelist" ? styles.activeMenu : ""
              }`}
              onClick={() => setActiveSection("marineinsurancelist")}
            >
              <span className={styles.iconLabel}>
                <FiAnchor className={styles.icon} />
                <span className={styles.label}>Marine Insurance</span>
              </span>
            </li>
            <li
              className={`${styles.menuItem} ${
                activeSection === "travelinsurancelist" ? styles.activeMenu : ""
              }`}
              onClick={() => setActiveSection("travelinsurancelist")}
            >
              <span className={styles.iconLabel}>
                <FiMap className={styles.icon} />
                <span className={styles.label}>Travel Insurance</span>
              </span>
            </li>
            <li
              className={`${styles.menuItem} ${
                activeSection === "shopinsurancelist" ? styles.activeMenu : ""
              }`}
              onClick={() => setActiveSection("shopinsurancelist")}
            >
              <span className={styles.iconLabel}>
                <FiShoppingBag className={styles.icon} />
                <span className={styles.label}>Shop Insurance</span>
              </span>
            </li>
            <li
              className={`${styles.menuItem} ${
                activeSection === "healthinsurancelist" ? styles.activeMenu : ""
              }`}
              onClick={() => setActiveSection("healthinsurancelist")}
            >
              <span className={styles.iconLabel}>
                <FiHeart className={styles.icon} />
                <span className={styles.label}>Health Insurance</span>
              </span>
            </li>
            <li
              className={`${styles.menuItem} ${
                activeSection === "homeinsurancelist" ? styles.activeMenu : ""
              }`}
              onClick={() => setActiveSection("homeinsurancelist")}
            >
              <span className={styles.iconLabel}>
                <FiHome className={styles.icon} />
                <span className={styles.label}>Home Insurance</span>
              </span>
            </li>
            <li
              className={`${styles.menuItem} ${
                activeSection === "doctorinsurancelist" ? styles.activeMenu : ""
              }`}
              onClick={() => setActiveSection("doctorinsurancelist")}
            >
              <span className={styles.iconLabel}>
                <FiActivity className={styles.icon} />
                <span className={styles.label}>Doctor Insurance</span>
              </span>
            </li>
            <li
              className={`${styles.menuItem} ${
                activeSection === "officepackagepolicylist" ? styles.activeMenu : ""
              }`}
              onClick={() => setActiveSection("officepackagepolicylist")}
            >
              <span className={styles.iconLabel}>
                <FiPackage className={styles.icon} />
                <span className={styles.label}>Office Package Policy</span>
              </span>
            </li>
            <li
              className={`${styles.menuItem} ${
                activeSection === "directorlist" ? styles.activeMenu : ""
              }`}
              onClick={() => setActiveSection("directorlist")}
            >
              <span className={styles.iconLabel}>
                <FiBookOpen className={styles.icon} />
                <span className={styles.label}>Director Officer Liability</span>
              </span>
            </li>

            {/* Policy */}
            <p className={styles.sectionTitle}>Policy</p>
            <li
              className={`${styles.menuItem} ${
                activeSection === "policyDashboard" ? styles.activeMenu : ""
              }`}
              onClick={() => setActiveSection("policyDashboard")}
            >
              <span className={styles.iconLabel}>
                <FiFileText className={styles.icon} />
                <span className={styles.label}>Policy Data</span>
              </span>
            </li>

            {/* Customer */}
            <p className={styles.sectionTitle}>Customer</p>
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
                <FiUser className={styles.icon} />
                <span className={styles.label}>User List</span>
              </span>
            </li>

            {/* POSP */}
            <p className={styles.sectionTitle}>POSP</p>
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
                <FiBriefcase className={styles.icon} />
                <span className={styles.label}>Agents</span>
              </span>
            </li>
            <li
              className={`${styles.menuItem} ${
                activeSection === "reviewApplication" ? styles.activeMenu : ""
              }`}
              onClick={() => setActiveSection("reviewApplication")}
            >
              <span className={styles.iconLabel}>
                <FiClipboard className={styles.icon} />
                <span className={styles.label}>Review Application</span>
              </span>
            </li>
            <li
              className={`${styles.menuItem} ${
                activeSection === "showResult" ? styles.activeMenu : ""
              }`}
              onClick={() => setActiveSection("showResult")}
            >
              <span className={styles.iconLabel}>
                <FiAward className={styles.icon} />
                <span className={styles.label}>Certificate</span>
              </span>
            </li>

            {/* Home Page */}
            <p className={styles.sectionTitle}>Home Page</p>
            <li
              className={`${styles.menuItem} ${
                activeSection === "homeSection" ? styles.activeMenu : ""
              }`}
              onClick={() => {
                setActiveSection("homeSection");
                if (window.innerWidth <= 768) {
                  setSidebarOpen(false);
                }
              }}
            >
              <span className={styles.iconLabel}>
                <FiSettings className={styles.icon} />
                <span className={styles.label}>Home Page</span>
              </span>
            </li>

            {/* Admin */}
            <p className={styles.sectionTitle}>Admin</p>
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
                <FiShield className={styles.icon} />
                <span className={styles.label}>Admin</span>
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
                <FiUsers className={styles.icon} />
                <span className={styles.label}>Manager</span>
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
                <p className={styles.cardValue}>{policies.length}</p>
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

          {activeSection === "policyDashboard" && <PolicyDashboard />}
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
