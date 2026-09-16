"use client";

import React, { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiEdit3, FiLock, FiKey, FiLogOut } from "react-icons/fi";
import { FaUser } from "react-icons/fa";
import styles from "@/styles/pages/admindashboard.module.css";

// Shared between admindashboard.tsx and superadmin.tsx (previously defined
// twice, once inline in each file) — the header avatar/dropdown for both
// admin panel variants, which share the same admindashboard.module.css.
export type ProfileMenuAdmin = {
  userFirstName?: string;
  userLastName?: string;
  email?: string;
} | null;

export const ProfileMenu = ({
  admin,
  onNavigate,
  onLogout,
}: {
  admin: ProfileMenuAdmin;
  onNavigate: (section: string) => void;
  onLogout: () => void;
}) => {
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
        <span className={styles.profileAvatar}><FaUser size={16} /></span>
        <FiChevronDown
          size={14}
          className={`${styles.profileChevron} ${open ? styles.profileChevronOpen : ""}`}
        />
      </button>

      {open && (
        <div className={styles.profileDropdown}>
          <div className={styles.profileDropdownHeader}>
            <span className={styles.profileAvatar}><FaUser size={16} /></span>
            <div className={styles.profileDropdownIdentity}>
              <span className={styles.profileDropdownName}>
                {admin?.userFirstName ?? "Admin"} {admin?.userLastName ?? ""}
              </span>
              {admin?.email && (
                <span className={styles.profileDropdownEmail}>{admin.email}</span>
              )}
            </div>
          </div>

          <div className={styles.profileDropdownDivider} />

          <button type="button" className={styles.profileDropdownItem} onClick={() => go("profileEdit")}>
            <span className={styles.profileItemIcon}><FiEdit3 size={15} /></span>
            <span className={styles.profileItemLabel}>Edit Profile</span>
          </button>
          <button type="button" className={styles.profileDropdownItem} onClick={() => go("changepassword")}>
            <span className={styles.profileItemIcon}><FiLock size={15} /></span>
            <span className={styles.profileItemLabel}>Change Password</span>
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
