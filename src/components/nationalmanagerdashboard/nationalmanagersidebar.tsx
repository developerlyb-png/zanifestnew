"use client";
import React from "react";
import styles from "@/styles/pages/nationalmanager.module.css";
import { FiHome, FiLock } from "react-icons/fi";

interface NationalManagerSidebarProps {
 activeSection: string;   
 setActiveSection: (section: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
}

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
    items: [
      {
        icon: FiLock,
        label: "List of State Manager",
        sectionKey: "listofstatemanager",
      },
    ],
  },
  {
    title: "Security",
    items: [
      { icon: FiLock, label: "Reset Password", sectionKey: "resetpassword" },
    ],
  },
   {
    title: "Profile",
    items: [
      { icon: FiLock, label: "Your Profile Edit", sectionKey: "profileEdit"},
    ],
  },
];

const NationalManagerSidebar: React.FC<NationalManagerSidebarProps> = ({
    activeSection,   
  setActiveSection,
  sidebarOpen,
  setSidebarOpen,
  handleLogout,
}) => {
  return (
    <aside
      className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarMobile : ""}`}
    >
      <div>
        {menuSections.map((section, index) => (
          <div key={index}>
            <p className={styles.sectionTitle}>{section.title}</p>
            <ul className={styles.menu}>
              {section.items.map((item, idx) => (
                <li
                  key={idx}
                  className={`${styles.menuItem} ${
                    activeSection === item.sectionKey ? styles.activeMenu : ""
                  }`}
                  role="button"
                  tabIndex={0}
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

      <div className={styles.mobileOnlyLogout}>
        <button className={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default NationalManagerSidebar;
