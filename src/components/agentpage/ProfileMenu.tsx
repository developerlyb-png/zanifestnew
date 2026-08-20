"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/pages/agent.module.css";
import { FiChevronDown, FiEdit3, FiKey, FiLogOut } from "react-icons/fi";

type ProfileMenuAgent = {
  firstName?: string;
  lastName?: string;
  email?: string;
} | null;

interface ProfileMenuProps {
  agent: ProfileMenuAgent;
  onNavigate: (section: string) => void;
  onLogout: () => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ agent, onNavigate, onLogout }) => {
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

  const initials = `${(agent?.firstName || "A").charAt(0)}${(
    agent?.lastName || ""
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
                {agent?.firstName ?? "Agent"} {agent?.lastName ?? ""}
              </span>
              {agent?.email && (
                <span className={styles.profileDropdownEmail}>{agent.email}</span>
              )}
            </div>
          </div>

          <div className={styles.profileDropdownDivider} />

          <button type="button" className={styles.profileDropdownItem} onClick={() => go("profileEdit")}>
            <span className={styles.profileItemIcon}><FiEdit3 size={15} /></span>
            <span className={styles.profileItemLabel}>Edit Profile</span>
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

export default ProfileMenu;
