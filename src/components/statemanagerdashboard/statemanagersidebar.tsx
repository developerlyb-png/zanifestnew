"use client";
import React from "react";
import { FiHome, FiLock } from "react-icons/fi";
import styles from "@/styles/pages/statemanager.module.css";

type SidebarItem = {
  icon: React.ComponentType; // ✅ More specific than React.ElementType
  label: string;
  sectionKey: string;
};

type SidebarSection = {
  section: string;
  items: SidebarItem[];
};

type StateManagerSidebarProps = {
  setActiveSection: (section: string) => void;
  activeSection: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
};

const sidebarMenu: SidebarSection[] = [
  {
    section: "Menu",
    items: [
      {
        icon: FiHome,
        label: "Dashboard",
        sectionKey: "dashboard",
      },
    ],
  },
   {
    section: "List",
    items: [
      {
        icon: FiLock,
        label: "List of District Manager",
        sectionKey: "listofdistrictmanager",
      },
    ],
  },
  {
    section: "Security",
    items: [
      {
        icon: FiLock,
        label: "Reset Password",
        sectionKey: "resetpassword",
      },
    ],
  },
 
];

const StateManagerSidebar: React.FC<StateManagerSidebarProps> = ({
  setActiveSection,
  activeSection,
  sidebarOpen,
  setSidebarOpen,
  handleLogout,
}) => {
  return (
    <aside
      className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarMobile : ""}`}
    >
      <div>
        {sidebarMenu.map((section, index) => (
          <div key={index}>
            <p className={styles.sectionTitle}>{section.section}</p>
            <ul className={styles.menu}>
              {section.items.map((item, idx) => (
                <li
                  key={idx}
                  className={`${styles.menuItem} ${
                    activeSection === item.sectionKey ? styles.activeItem : ""
                  }`}
                  onClick={() => {
                    setActiveSection(item.sectionKey);
                    setSidebarOpen(false);
                  }}
                >
                  <div className={styles.iconLabel}>
                    <span className={styles.icon}>
                      <item.icon /> {/* ✅ This is the cleanest and safest way */}
                    </span>
                    <span className={styles.label}>{item.label}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className={styles.mobileOnlyLogout}>
        <button className={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default StateManagerSidebar;
