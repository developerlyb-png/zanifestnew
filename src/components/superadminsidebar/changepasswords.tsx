"use client";
import React, { useState } from "react";
import { FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import { toast } from "react-hot-toast";
import styles from "@/styles/components/superadminsidebar/changepassword.module.css";

// mode "reset": logged-in admin sets a new password without the current one
const ChangePassword = ({ mode = "change" }: { mode?: "change" | "reset" }) => {
  const isReset = mode === "reset";
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(isReset ? "/api/admin/set-password" : "/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(isReset ? { newPassword } : { currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update password");

      toast.success(isReset ? "Password reset successfully" : "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconBadge}>
          <FiLock size={20} />
        </div>
        <h2 className={styles.title}>{isReset ? "Reset Password" : "Change Password"}</h2>
        <p className={styles.subtitle}>
          {isReset
            ? "Set a new password for your own account."
            : "Update the password for your own account."}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {!isReset && (
          <div className={styles.formGroup}>
            <label htmlFor="currentPassword" className={styles.label}>
              Current Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                type={showCurrent ? "text" : "password"}
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={styles.input}
                required
              />
              <span className={styles.eyeIcon} onClick={() => setShowCurrent((v) => !v)}>
                {showCurrent ? <FiEyeOff /> : <FiEye />}
              </span>
            </div>
          </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="newPassword" className={styles.label}>
              New Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                type={showNew ? "text" : "password"}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.input}
                required
                minLength={6}
              />
              <span className={styles.eyeIcon} onClick={() => setShowNew((v) => !v)}>
                {showNew ? <FiEyeOff /> : <FiEye />}
              </span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirm New Password
            </label>
            <input
              type={showNew ? "text" : "password"}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.input}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className={styles.loginBtn} disabled={submitting}>
            {submitting ? "Updating..." : isReset ? "Reset Password" : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
