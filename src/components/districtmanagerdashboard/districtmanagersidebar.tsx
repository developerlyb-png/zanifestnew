"use client";
import React from "react";
import styles from "@/styles/pages/districtmanager.module.css";
import { FiHome, FiLock } from "react-icons/fi";

type DistrictManagerSidebarProps = {
  setActiveSection: (section: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleLogout: () => Promise<void>;
};

type MenuItem = {
  icon: React.ComponentType;
  label: string;
  sectionKey: string;
};

const menuSections: { title: string; items: MenuItem[] }[] = [
  {
    title: "Menu",
    items: [{ icon: FiHome, label: "Dashboard", sectionKey: "dashboard" }],
  },
  {
    title: "List",
    items: [{ icon: FiLock, label: "List of Agent", sectionKey: "listofagent" }],
  },
  {
    title: "Security",
    items: [{ icon: FiLock, label: "Reset Password", sectionKey: "resetpassword" }],
  },
  
];

const DistrictManagerSidebar: React.FC<DistrictManagerSidebarProps> = ({
  setActiveSection,
  sidebarOpen,
  setSidebarOpen,
  handleLogout,
}) => {
  return (
    <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarMobile : ""}`}>
      <div>
        {menuSections.map((section, index) => (
          <div key={index}>
            <p className={styles.sectionTitle}>{section.title}</p>
            <ul className={styles.menu}>
              {section.items.map((item, idx) => (
                <li
                  key={idx}
                  className={styles.menuItem}
                  role="button"
                  tabIndex={0}
                  aria-label={item.label}
                  onClick={() => {
                    setActiveSection(item.sectionKey);
                    setSidebarOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveSection(item.sectionKey);
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <div className={styles.iconLabel}>
                    <span className={styles.icon}>
                      <item.icon />
                    </span>
                    <span className={styles.label}>{item.label}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Mobile Only Logout */}
      <div className={styles.mobileOnlyLogout}>
        <button className={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default DistrictManagerSidebar;
