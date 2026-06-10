
"use client";
import React from "react";
import Image from "next/image";
import logo from "@/assets/logo.png";
import { FiMenu, FiX } from "react-icons/fi";
import styles from "@/styles/pages/statemanager.module.css";

type User = {
  name?: string;
};

type StateManagerHeaderProps = {
  user?: User;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
};

const StateManagerHeader: React.FC<StateManagerHeaderProps> = ({
  user,
  sidebarOpen,
  setSidebarOpen,
  handleLogout,
}) => {
  return (
    <header className={styles.header}>
      <h3>Hi {user?.name ?? "State Manager"}</h3>
      <div className={styles.logoContainer}>
        <Image
          src={logo}
          alt="Logo"
          width={160}
          height={45}
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
  );
};

export default StateManagerHeader;
