"use client";
import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import styles from '@/styles/components/superadminsidebar/changepassword.module.css';


const ChangePassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try{

      const res = await fetch("api/admin/change-password",  {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          newPassword: password,
        }),
      });

       console.log("response from change password ->", res);

      const data = await res.json();
      console.log("change password response:", data);

      if (!res.ok) throw new Error(data.message || "Failed to change password");

      alert("Password reset successful");

    }
    catch (err: any) {
      alert(err.message || "Something went wrong");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* <div className={styles.logoContainer}>
          <Image src={logo} alt=" Logo" width={100}  />
        </div> */} 

        <h2 className={styles.title}>Change Password</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                required
              />
              <span
                className={styles.eyeIcon}
                onClick={handleTogglePassword}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </span>
            </div>
          </div>

         

          <button type="submit" className={styles.loginBtn}>
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
