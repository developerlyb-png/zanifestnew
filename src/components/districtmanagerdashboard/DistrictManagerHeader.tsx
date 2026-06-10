"use client";
import React from "react";
import Image from "next/image";
import logo from "@/assets/logo.png";
import styles from "@/styles/pages/districtmanager.module.css";
import { FiMenu, FiX } from "react-icons/fi";

type User = {
  name?: string;
};

type DistrictManagerHeaderProps = {
  user: User | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleLogout: () => Promise<void>;
};

const DistrictManagerHeader: React.FC<DistrictManagerHeaderProps> = ({
  user,
  sidebarOpen,
  setSidebarOpen,
  handleLogout,
}) => {  
  
  console.log("name of dm -> ", user)
  
  return (
    <header className={styles.header}>
      <h3>Hi {user?.name ?? "District Manager"}</h3>
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

export default DistrictManagerHeader;
