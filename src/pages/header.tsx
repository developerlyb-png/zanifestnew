import React from "react";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "@/styles/pages/header.module.css";
import {
  FiHome,
  FiCalendar,
  FiFileText,
  FiFolder,
  FiClipboard,
  FiGrid,
  FiUser,
  FiPackage,
  FiLayers,
  FiChevronRight,
} from "react-icons/fi";
import { useRouter } from "next/router";

const Header = () => {
  const router = useRouter();

  const sidebarMenu = [
    {
      section: "Menu",
      items: [{ icon: <FiHome/>, label: "Dashboard" }],
    },
    {
      section: "Apps",
      items: [
        { icon: <FiCalendar />, label: "Calendar" },
        { icon: <FiFileText />, label: "Tickets" },
        { icon: <FiFolder />, label: "File Manager" },
        { icon: <FiClipboard />, label: "Kanban Board" },
        { icon: <FiGrid />, label: "Project", expandable: true },
      ],
    },
    {
      section: "Custom",
      items: [
        { icon: <FiUser />, label: "Auth Pages", expandable: true },
        { icon: <FiLayers />, label: "Extra Pages", expandable: true },
      ],
    },
    {
      section: "Elements",
      items: [
        { icon: <FiGrid />, label: "Components", expandable: true },
        { icon: <FiPackage />, label: "Extended UI", expandable: true },
        { icon: <FiFileText />, label: "Forms", expandable: true },
      ],
    },
  ];

  const handleLogout = () => {
    console.log("Logged out");
  };

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <Image src={logo} alt="Logo" width={130} height={40} className={styles.logo} />
        </div>
        <button className={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Sidebar + Content */}
      <div className={styles.mainArea}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          {sidebarMenu.map((section, index) => (
            <div key={index}>
              <p className={styles.sectionTitle}>{section.section}</p>
              <ul className={styles.menu}>
                {section.items.map((item, idx) => (
                  <li key={idx} className={styles.menuItem}>
                    <div className={styles.iconLabel}>
                      <span className={styles.icon}>{item.icon}</span>
                      <span className={styles.label}>{item.label}</span>
                    </div>
                    {item.expandable && <FiChevronRight size={14} />}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        {/* Main Content */}
        <main className={styles.content}>
          <h2 className={styles.dashboardTitle}>Dashboard</h2>
          <div className={styles.cardGrid}>
            {[
              { title: "User Dashboard", time: "4 Hrs ago", route: "/userpage" },
              { title: "Admin Dashboard", time: "3 Hrs ago", route: "/adminpage" },
              { title: "Manager Dashboard", time: "5 Hrs ago", route: "/managerpage" },
              { title: "Agent Dashboard", time: "1 Day ago", route: "/agentpage" },
            ].map((card, index) => (
              <div
                key={index}
                className={styles.card}
                onClick={() => router.push(card.route)}
                style={{ cursor: "pointer" }}
              >
                <div className={styles.cardHeader}>
                  <h4>{card.title}</h4>
                  <span className={styles.dots}>⋯</span>
                </div>
                <p className={styles.subText}>New Task Assign</p>
                <div className={styles.cardFooter}>
                  <span className={styles.time}>⏱ {card.time}</span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Header;





