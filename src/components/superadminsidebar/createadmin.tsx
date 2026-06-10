import React, { useState, useEffect } from "react";
import styles from "@/styles/components/superadminsidebar/createadmin.module.css";
import { FiEye, FiEyeOff } from "react-icons/fi";
import axios from "axios";

interface CreateAdminProps {
  initialData?: any;
  mode?: "create" | "edit"; // Optional mode prop
}

const CreateAdmin: React.FC<CreateAdminProps> = ({ initialData, mode }) => {
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
    role: isSuperAdmin ? "superadmin" : "admin",
  };

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
        alert("Admin created successfully!");
        setUserFirstName("");
        setUserLastName("");
        setEmail("");
        setPassword("");
        setIsSuperAdmin(false);
        setShowPassword(false);
      } else {
        alert(result.message || "Failed to create admin.");
      }
    } else if (mode === "edit") {
      const res = await axios.patch("/api/admin/updateadmin", data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("managerToken")}`,
        },
      });
      alert("Profile updated successfully!");
    }
  } catch (error) {
    console.error("Error creating/updating admin:", error);
    alert("Server error!");
  }
};


  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>
        {mode==="edit" ? "Edit Admin Profile" : "Create Admin"}
      </h2>
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
  <label className={styles.checkboxLabel}>
    <input
      type="checkbox"
      checked={isSuperAdmin}
      onChange={() => setIsSuperAdmin(!isSuperAdmin)}
    />
    Make Super Admin
  </label>

  <button type="submit" className={styles.submitButton}>
    {mode === "edit" ? "Update" : "Create"}
  </button>
</div>

      </form>
    </div>
  );
};

export default CreateAdmin;
