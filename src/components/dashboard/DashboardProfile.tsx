import React, { useState } from "react";
import { LuUser } from "react-icons/lu";
import styles from "@/styles/components/dashboard/DashboardProfile.module.css";
import FloatingLabelInput from "../ui/FloatingLabelInput";
import { useAuth } from "@/context/AuthContext";

function DashboardProfile() {
  const { user } = useAuth();

  const [firstName, setFirstName] = useState<any>();
  const [lastName, setLastName] = useState<any>();
  const [email, setEmail] = useState<any>();
  const [number, setNumber] = useState<any>();
  const [DOB, setDOB] = useState<any>();
  const [income, setIncome] = useState<any>();
  const [maritalStatus, setMaritalStatus] = useState<any>();
  const [city, setCity] = useState<any>();
  const [annualIncome, setAnnualIncome] = useState<any>();

  return (
    <div className={styles.cont}>
      <div className={styles.greet}>
        Hi, {user?.name || "User"} <LuUser />
      </div>
      <div className={styles.inner}>
        <div className={styles.header}>Personal Details</div>
        <div className={styles.line}></div>

        <div className={styles.form}>
          <FloatingLabelInput
            label="First Name"
            value={firstName}
            onChange={setFirstName}
            id="firstname"
            type="text"
          />
          <FloatingLabelInput
            label="Last Name"
            value={lastName}
            onChange={setLastName}
            id="lastname"
            type="text"
          />
          <FloatingLabelInput
            label="Email"
            value={email}
            onChange={setEmail}
            id="email"
            type="email"
          />
          <FloatingLabelInput
            label="Mobile Number"
            value={number}
            onChange={setNumber}
            id="number"
            type="number"
          />
          <FloatingLabelInput
            label="Date of Birth"
            value={DOB}
            onChange={setDOB}
            id="dob"
            type="date"
          />
          <FloatingLabelInput
            label="Annual Income"
            value={income}
            onChange={setIncome}
            id="income"
            type="number"
          />
          <FloatingLabelInput
            label="Marital Status"
            value={maritalStatus}
            onChange={setMaritalStatus}
            id="married"
            type="text"
          />
          <FloatingLabelInput
            label="City"
            value={city}
            onChange={setCity}
            id="city"
            type="text"
          />
          <FloatingLabelInput
            label="Annual Income"
            value={annualIncome}
            onChange={setAnnualIncome}
            id="annIncome"
            type="number"
          />
        </div>

        <div className={styles.bottomButton}>
          <button className={styles.button}>Save Details</button>
        </div>
      </div>
    </div>
  );
}

export default DashboardProfile;
