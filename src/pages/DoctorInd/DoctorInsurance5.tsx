"use client";

import React, { useState } from "react";
import styles from "@/styles/pages/DoctorInd/doctorinsurance5.module.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import Image from "next/image";
import { useRouter } from "next/navigation";
import futureImg from "@/assets/doctor/Future_Generali_India_Life_Insurance_logo.jpg";
import UserDetails from "@/components/ui/UserDetails";

const ProposalForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState("+91 ");
  const [pan, setPan] = useState("");
  const [pincode, setPincode] = useState("");
  const [insuredName, setInsuredName] = useState("");
  const [dob, setDob] = useState("");
  const [licenseYear, setLicenseYear] = useState("");
  const [registrationYear, setRegistrationYear] = useState("");

  const [qualificationYear, setQualificationYear] = useState("");
  const [practiceYears, setPracticeYears] = useState("");
  const [email, setEmail] = useState(""); // ✅ Email ke liye state

  const router = useRouter();

  // ✅ Mobile handler
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const prefix = "+91 ";
    let input = e.target.value;

    if (!input.startsWith(prefix)) {
      input = prefix;
    }

    const digitsOnly = input.substring(prefix.length).replace(/\D/g, "");
    const limitedDigits = digitsOnly.slice(0, 10);

    setMobile(prefix + limitedDigits);
  };
  const handleRegistrationYearChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const digitsOnly = e.target.value.replace(/\D/g, ""); // sirf numbers
    setRegistrationYear(digitsOnly.slice(0, 4)); // max 4 digit (YYYY)
  };
  // ✅ PAN handler
  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.toUpperCase();
    input = input.replace(/[^A-Z0-9]/g, "");
    setPan(input.slice(0, 11));
  };

  // ✅ Pincode handler
  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    setPincode(digitsOnly.slice(0, 6));
  };

  // ✅ Insured name handler (no numbers, first letter uppercase)
  const handleInsuredNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/[^a-zA-Z\s]/g, ""); // remove numbers & special chars
    if (input.length > 0) {
      input = input.charAt(0).toUpperCase() + input.slice(1); // first letter capital
    }
    setInsuredName(input);
  };

  // ✅ DOB handler (date picker)
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDob(e.target.value);
  };
  // ✅ Email handler
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.trim().toLowerCase();
    input = input.replace(/[^a-z0-9@._-]/g, ""); // sirf valid chars allow karega
    setEmail(input);
  };
  // ✅ Qualification Year
  const handleQualificationYearChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    setQualificationYear(digitsOnly.slice(0, 4));
  };

  // ✅ Practice Years
  const handlePracticeYearsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    setPracticeYears(digitsOnly.slice(0, 2));
  };

  const handleLicenseYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, ""); // sirf numbers
    setLicenseYear(digitsOnly.slice(0, 4)); // 4 digit (YYYY)
  };

  return (
    <>
      <UserDetails />
      <Navbar />
      <div className={styles.container}>
        <div className={styles.header}>
          <button
            className={styles.backBtn}
            onClick={() => router.push("DoctorInsurance2")}
          >
            ←
          </button>
          <h2 className={styles.title}>Proposal form</h2>
        </div>

        {/* Stepper */}
        <div className={styles.stepsWrapper}>
          <div className={styles.stepItem}>
            <div
              className={`${styles.circle} ${
                step > 1 ? styles.complete : step === 1 ? styles.active : ""
              }`}
            >
              {step > 1 ? "✓" : ""}
            </div>
            <div className={styles.stepText}>
              <span className={styles.stepTitle}>STEP 1</span>
              <span
                className={
                  step > 1
                    ? styles.stepComplete
                    : step === 1
                    ? styles.stepSub
                    : styles.stepSubInactive
                }
              >
                {step > 1 ? "Complete" : step === 1 ? "In process" : ""}
              </span>
            </div>
          </div>

          <div className={styles.line} />

          <div className={styles.stepItem}>
            <div
              className={`${styles.circle} ${
                step === 2 ? styles.active : step > 2 ? styles.complete : ""
              }`}
            >
              {step > 2 ? "✓" : ""}
            </div>
            <div className={styles.stepText}>
              <span className={styles.stepTitle}>STEP 2</span>
              <span
                className={
                  step === 2
                    ? styles.stepSub
                    : step > 2
                    ? styles.stepComplete
                    : styles.stepSubInactive
                }
              >
                {step === 2
                  ? "In process"
                  : step > 2
                  ? "Complete"
                  : "Incomplete"}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.formSection}>
            {step === 1 && (
              <>
                <h3 className={styles.subTitle}>Policy details</h3>
                <form className={styles.form}>
                  <div className={styles.row}>
                    <select className={styles.input}>
                      <option>Dr.</option>
                      <option>Mr.</option>
                      <option>Mrs.</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Insured name *"
                      value={insuredName}
                      onChange={handleInsuredNameChange}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.row}>
                    <input
                      type="date"
                      placeholder="Date of birth *"
                      value={dob}
                      onChange={handleDobChange}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.row}>
                    <input
                      type="tel"
                      placeholder="Enter mobile number"
                      value={mobile}
                      onChange={handleMobileChange}
                      className={styles.input}
                      autoComplete="tel"
                      maxLength={14}
                    />
                    <input
                      type="email"
                      placeholder="Email id *"
                      value={email}
                      onChange={handleEmailChange}
                      className={styles.input}
                      required
                      pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                      title="Please enter a valid email address"
                    />{" "}
                  </div>
                  <div className={styles.row}>
                    <input
                      type="text"
                      placeholder="Address *"
                      className={styles.input}
                    />
                    <input
                      type="text"
                      placeholder="Address 2 *"
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.row}>
                    <input
                      type="text"
                      placeholder="State name"
                      className={styles.input}
                    />
                    <input
                      type="tel"
                      placeholder="Enter your pincode"
                      value={pincode}
                      onChange={handlePincodeChange}
                      maxLength={6}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.row}>
                    <input
                      className={styles.input}
                      placeholder="PAN no. *"
                      value={pan}
                      onChange={handlePanChange}
                      maxLength={11}
                    />
                  </div>
                </form>
                <button
                  className={styles.continueBtn}
                  onClick={() => setStep(2)}
                >
                  Next
                </button>
              </>
            )}
            {step === 2 && (
              <>
                <h3 className={styles.subTitle}>Additional details</h3>
                <form className={styles.form}>
                  <div className={styles.row}>
                    <input
                      type="text"
                      placeholder="Policy start date *"
                      className={styles.input}
                      defaultValue="21-08-2025"
                    />
                    <input
                      type="text"
                      placeholder="Policy end date *"
                      className={styles.input}
                      defaultValue="20-08-2026"
                    />
                  </div>
                  <div className={styles.row}>
                    <input
                      type="text"
                      placeholder="Territory"
                      className={styles.input}
                      defaultValue="India"
                    />
                    <input
                      type="text"
                      placeholder="Jurisdiction"
                      className={styles.input}
                      defaultValue="India"
                    />
                  </div>
                  <div className={styles.row}>
                    <input
                      type="text"
                      placeholder="Registration number *"
                      className={styles.input}
                    />
                    <input
                      type="text"
                      placeholder="Year of registration *"
                      className={styles.input}
                      value={registrationYear}
                      onChange={handleRegistrationYearChange}
                    />
                  </div>
                  <div className={styles.row}>
                    <input
                      type="text"
                      placeholder="License year *"
                      className={styles.input}
                      value={licenseYear}
                      onChange={handleLicenseYearChange}
                    />
                    <select className={styles.input}>
                      <option>Qualification</option>
                      <option>MBBS</option>
                      <option>MD</option>
                    </select>
                  </div>
                  <div className={styles.row}>
                    <input
                      type="text"
                      placeholder="Year of qualification *"
                      value={qualificationYear}
                      onChange={handleQualificationYearChange}
                      className={styles.input}
                      maxLength={4}
                    />{" "}
                    <input
                      type="text"
                      placeholder="Number of practice year *"
                      value={practiceYears}
                      onChange={handlePracticeYearsChange}
                      className={styles.input}
                      maxLength={2}
                    />
                  </div>
                  <div className={styles.checkboxRow}>
                    <input type="checkbox" id="gst" />
                    <label htmlFor="gst">Add GST Number</label>
                  </div>
                </form>
                <div className={styles.row} style={{ marginTop: "1rem" }}>
                  <button
                    className={styles.backBtnNav}
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                  <button
                    className={styles.continueBtn}
                    onClick={() => router.push("DoctorInsurance7")}
                  >
                    Submit
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right Section stays same */}
          <div className={styles.orderSection}>
            <Image
              src={futureImg}
              alt="Future Generali"
              className={styles.logo}
            />
            <h4 className={styles.orderTitle}>Professional Indemnity</h4>
            <div className={styles.orderDetails}>
              <div>
                <span className={styles.label}>Plan name</span>
                <span className={styles.value}>Professional Indemnity</span>
              </div>
              <div>
                <span className={styles.label}>Cover amount</span>
                <span className={styles.value}>₹ 1 Crore</span>
              </div>
              <div className={styles.total}>
                <span>Total premium</span>
                <span className={styles.price}>₹ 5,553/-</span>
              </div>
            </div>
            <button
              className={styles.continueBtn}
              onClick={() => router.push("DoctorInsurance7")}
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ProposalForm;
