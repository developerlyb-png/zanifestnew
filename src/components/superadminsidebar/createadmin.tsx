import React, { useState, useEffect } from "react";
import styles from "@/styles/components/superadminsidebar/createadmin.module.css";
import { FiEye, FiEyeOff, FiUserPlus, FiEdit3 } from "react-icons/fi";
import axios from "axios";
import { toast } from "react-hot-toast";

interface CreateAdminProps {
  initialData?: any;
  mode?: "create" | "edit"; // Optional mode prop
  onSuccess?: () => void;
  onCancel?: () => void;
  // Only a superadmin may grant/revoke superadmin rights — the caller passes
  // this based on the logged-in user's own role.
  canAssignSuperAdmin?: boolean;
}

const CreateAdmin: React.FC<CreateAdminProps> = ({
  initialData,
  mode = "create",
  onSuccess,
  onCancel,
  canAssignSuperAdmin = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // edit form
  useEffect(() => {
    if (mode==="edit" && initialData) {
      setUserFirstName(initialData.userFirstName || "");
      setUserLastName(initialData.userLastName || "");
      setEmail(initialData.email || "");
      setPassword(""); //do not preload password.. it is dangerous...
      setIsSuperAdmin(initialData.role === "superadmin");
    }
  }, [initialData]);

 

  const capitalizeFirstLetter = (value: string) => {
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const capitalized = e.target.value;
    setUserFirstName(capitalized);
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const capitalized = e.target.value;
    setUserLastName(capitalized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const data: any = {
    userFirstName,
    userLastName,
    email,
  };

  // Only send a role change when the current user is actually allowed to
  // make one — the backend also enforces this independently.
  if (canAssignSuperAdmin) {
    data.role = isSuperAdmin ? "superadmin" : "admin";
  }

  if (password) {
    data.password = password; // only send if user typed something
  }

  try {
    if (mode === "create") {
      const res = await fetch("/api/createadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("Admin created successfully!");
        setUserFirstName("");
        setUserLastName("");
        setEmail("");
        setPassword("");
        setIsSuperAdmin(false);
        setShowPassword(false);
        onSuccess?.();
      } else {
        toast.error(result.message || "Failed to create admin.");
      }
    } else if (mode === "edit") {
      await axios.patch("/api/admin/updateadmin", data, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      toast.success("Profile updated successfully!");
      onSuccess?.();
    }
  } catch (error) {
    console.error("Error creating/updating admin:", error);
    toast.error("Server error!");
  }
};


  return (
    <div className={styles.container}>
      <div className={styles.iconBadge}>
        {mode === "edit" ? <FiEdit3 size={20} /> : <FiUserPlus size={20} />}
      </div>
      <h2 className={styles.heading}>
        {mode==="edit" ? "Edit Admin Profile" : "Create Admin"}
      </h2>
      <p className={styles.subtitle}>
        {mode === "edit" ? "Update your name, email and other account details." : "Add a new admin account."}
      </p>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label htmlFor="userFirstName">First Name</label>
            <input
              type="text"
              id="userFirstName"
              name="userFirstName"
              className={styles.input}
              placeholder="Enter first name"
              value={userFirstName}
              onChange={handleFirstNameChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="userLastName">Last Name</label>
            <input
              type="text"
              id="userLastName"
              name="userLastName"
              className={styles.input}
              placeholder="Enter last name"
              value={userLastName}
              onChange={handleLastNameChange}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className={styles.input}
              placeholder="Enter email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.formGroup} style={{ position: "relative" }}>
            <label htmlFor="password">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              className={styles.input}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              className={styles.eyeIcon}
              style={{
                position: "absolute",
                right: 10,
                top: 38,
                cursor: "pointer",
              }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </span>
          </div>
        </div>

       <div className={styles.actionRow}>
  {canAssignSuperAdmin && (
    <label className={styles.checkboxLabel}>
      <input
        type="checkbox"
        checked={isSuperAdmin}
        onChange={() => setIsSuperAdmin(!isSuperAdmin)}
      />
      Make Super Admin
    </label>
  )}

  <div style={{ display: "flex", gap: 10, marginLeft: canAssignSuperAdmin ? 0 : "auto" }}>
    {onCancel && (
      <button
        type="button"
        className={styles.submitButton}
        style={{ background: "#fff", color: "#5b6577", border: "1.5px solid #e5e9f0", boxShadow: "none" }}
        onClick={onCancel}
      >
        Cancel
      </button>
    )}
    <button type="submit" className={styles.submitButton}>
      {mode === "edit" ? "Update" : "Create"}
    </button>
  </div>
</div>

      </form>
    </div>
  );
};

export default CreateAdmin;
