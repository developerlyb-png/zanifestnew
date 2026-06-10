"use client";

import React, { useState } from "react";
import styles from "@/styles/pages/dialog.module.css";

interface RegisterDialogProps {
  open: boolean;
  onClose: (type?: "cancel") => void;
  onSuccess: (data: { email: string }) => void;
}

export default function RegisterDialog({
  open,
  onClose,
  onSuccess,
}: RegisterDialogProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSignup = async () => {
    if (!username || !email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Registration failed");
        setLoading(false);
        return;
      }

      onSuccess({ email });
    } catch (err) {
      console.error(err);
      alert("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.box}>
        <h2 className={styles.title}>Register</h2>

        <input
          type="text"
          placeholder="Username"
          className={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className={styles.buttonGroup}>
          <button
            className={styles.primaryBtn}
            onClick={handleSignup}
            disabled={loading}
          >
            {loading ? "Please wait..." : "Signup"}
          </button>

          <button
            className={styles.cancelBtn}
            onClick={() => onClose("cancel")}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
