"use client";
import React from "react";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "@/styles/pages/agent.module.css";
import { FiMenu, FiX } from "react-icons/fi";

interface AgentHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleLogout: () => void;
}


const AgentHeader: React.FC<AgentHeaderProps> = ({
  sidebarOpen,
  setSidebarOpen,
  handleLogout,
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <Image src={logo} alt="Logo" width={150} height={45} className={styles.logo} />
      </div>
      <button className={styles.menuToggle} onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
      </button>
      <div className={styles.desktopOnlyLogout}>
        <button className={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default AgentHeader;
