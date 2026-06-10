"use client";

import React from "react";
import styles from "@/styles/pages/agent.module.css";
import {
  FiHome,
  FiUserPlus,
  FiUsers,
  FiLock,
  FiChevronRight,
} from "react-icons/fi";


interface AgentSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveSection: React.Dispatch<React.SetStateAction<string>>;
  activeSection: string; // ✅ ADD THIS
  handleLogout: () => void;
}

const AgentSidebar: React.FC<AgentSidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  setActiveSection,
  activeSection, 
  handleLogout,
}) => {
  const handleClick = (section: string) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  return (
    <aside
      className={`${styles.sidebar} ${
        sidebarOpen ? styles.sidebarMobile : ""
      }`}
    >
      <div className={styles.sidebarContent}>
        {/* MENU */}
        <p className={styles.sectionTitle}>MENU</p>
        <ul className={styles.menu}>
          <li
            className={`${styles.menuItem} ${
              activeSection === "dashboard" ? styles.active : ""
            }`}
            onClick={() => handleClick("dashboard")}
          >
            <div className={styles.iconLabel}>
              <FiHome className={styles.icon} />
              <span>Dashboard</span>
            </div>
          </li>
        </ul>

        {/* USER MANAGEMENT */}
        <p className={styles.sectionTitle}>USER MANAGEMENT</p>
        <ul className={styles.menu}>
          <li
            className={`${styles.menuItem} ${
              activeSection === "createuser" ? styles.active : ""
            }`}
            onClick={() => handleClick("createuser")}
          >
            <div className={styles.iconLabel}>
              <FiUserPlus className={styles.icon} />
              <span>Create User</span>
            </div>
          </li>

          <li
            className={`${styles.menuItem} ${
              activeSection === "userlist" ? styles.active : ""
            }`}
            onClick={() => handleClick("userlist")}
          >
            <div className={styles.iconLabel}>
              <FiUsers className={styles.icon} />
              <span>User List</span>
            </div>
          </li>
        </ul>

        {/* SECURITY */}
        <p className={styles.sectionTitle}>SECURITY</p>
        <ul className={styles.menu}>
          <li
            className={`${styles.menuItem} ${
              activeSection === "resetpassword" ? styles.active : ""
            }`}
            onClick={() => handleClick("resetpassword")}
          >
            <div className={styles.iconLabel}>
              <FiLock className={styles.icon} />
              <span>Reset Password</span>
            </div>
          </li>
        </ul>

        {/* LEAD MANAGEMENT */}
        <p className={styles.sectionTitle}>LEAD MANAGEMENT</p>
        <ul className={styles.menu}>
          <li
            className={`${styles.menuItem} ${
              activeSection === "leadsection" ? styles.active : ""
            }`}
            onClick={() => handleClick("leadsection")}
          >
            <div className={styles.iconLabel}>
              <FiUsers className={styles.icon} />
              <span>Lead</span>
            </div>
          </li>

          <li
            className={`${styles.menuItem} ${
              activeSection === "listofpolicy" ? styles.active : ""
            }`}
            onClick={() => handleClick("listofpolicy")}
          >
            <div className={styles.iconLabel}>
              <FiLock className={styles.icon} />
              <span>List of Policy</span>
            </div>
          </li>
        </ul>
        <p className={styles.sectionTitle}>CERTIFICATION</p>
<ul className={styles.menu}>
  <li
    className={`${styles.menuItem} ${
      activeSection === "downloadCertificate" ? styles.active : ""
    }`}
    onClick={() => handleClick("downloadCertificate")}
  >
    <div className={styles.iconLabel}>
      <FiChevronRight className={styles.icon} />
      <span>Download Certificate</span>
    </div>
  </li>
</ul>

      </div>
 


      {/* PROFILE BUTTON */}
      {/* <div className={styles.profileBox}>
        <button
          className={styles.profileBtn}
          onClick={() => handleClick("profileEdit")}
        >
          <span>Your Profile</span>
          <FiChevronRight />
        </button>
      </div> */}

      {/* MOBILE LOGOUT */}
      <div className={styles.mobileOnlyLogout}>
        <button className={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AgentSidebar;
