
"use client";
import React, { useState } from "react";
import styles from "@/styles/components/superadminsidebar/changepassword.module.css"; 
import { toast } from 'react-hot-toast';

const CreateUser = () => {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");

  const capitalizeEachWord = (value: string) => {
    return value
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = capitalizeEachWord(e.target.value);
    setUserName(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/users/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userName, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to create user");
      }

      toast.success("Email send to the user for password creation");
      setUserName("");
      setEmail("");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Create User</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            
            <input
              type="text"
              id="userName"
              placeholder="Full Name"
              value={userName}
              onChange={handleFullNameChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            
            <input
              type="email"
              id="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <button type="submit" className={styles.loginBtn}>
            Create User
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
