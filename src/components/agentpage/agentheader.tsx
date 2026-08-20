"use client";
import React from "react";
import Image from "next/image";
import logo from "@/assets/logowhite.png";
import styles from "@/styles/pages/agent.module.css";
import { FiMenu, FiX } from "react-icons/fi";
import ProfileMenu from "./ProfileMenu";

interface AgentHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleLogout: () => void;
  agentProfile?: { firstName?: string; lastName?: string; email?: string } | null;
  setActiveSection: React.Dispatch<React.SetStateAction<string>>;
}

const AgentHeader: React.FC<AgentHeaderProps> = ({
  sidebarOpen,
  setSidebarOpen,
  handleLogout,
  agentProfile,
  setActiveSection,
}) => {
  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.menuToggle}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
      </button>
      <div className={styles.headerBrand}>
        <Image src={logo} alt="Zanifest" width={118} height={30} className={styles.headerLogo} />
        <span className={styles.headerBrandSub}>Agent Panel</span>
      </div>
      <div className={styles.headerSpacer} />
      <div className={styles.desktopOnlyLogout}>
        <ProfileMenu agent={agentProfile ?? null} onNavigate={setActiveSection} onLogout={handleLogout} />
      </div>
    </header>
  );
};

export default AgentHeader;
