"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "@/styles/pages/Travel/travel5.module.css";
import { FiChevronDown } from "react-icons/fi";
import { FaMale, FaFemale } from "react-icons/fa";
import tataLogo from "@/assets/travel/tataaig.jpeg";

import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

const PersonalDetails: React.FC = () => {
  const [step, setStep] = useState(1);
  const [pincode, setPincode] = useState("");
  const [email, setEmail] = useState("");

  const router = useRouter();

  const handleBack = () => {
    if (step === 1) {
      router.push("Travel4"); // navigate to Travel4 page
    } else if (step === 2) {
      setStep(1); // go back to personal details
    } else if (step === 3) {
      setStep(2); // go back to medical history
    }
  };

  // Input Handlers
  const handleNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^a-zA-Z\s]/g, ""); // only letters + spaces
    value = value.replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize first letter of each word
    e.target.value = value;
  };

  const handleDOBInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // keep only digits

    if (value.length > 8) value = value.slice(0, 8); // max 8 digits (DDMMYYYY)

    // Auto format: DD-MM-YYYY
    if (value.length > 4) {
      value = value.replace(/(\d{2})(\d{2})(\d{1,4})/, "$1-$2-$3");
    } else if (value.length > 2) {
      value = value.replace(/(\d{2})(\d{1,2})/, "$1-$2");
    }

    e.target.value = value;
  };

  // ✅ Pincode handler
  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    setPincode(digitsOnly.slice(0, 6));
  };

  const handlePassportInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // allow only digits
    e.target.value = value;
  };

  const handlePanInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase(); // uppercase
    if (value.length > 11) value = value.slice(0, 11); // max 11 chars
    e.target.value = value;
  };

  const handleMobileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // only digits
    if (value.length > 10) value = value.slice(0, 10); // max 10 digits
    e.target.value = value;
  };
  // ✅ Email handler
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.trim().toLowerCase();
    input = input.replace(/[^a-z0-9@._-]/g, ""); // sirf valid chars allow karega
    setEmail(input);
  };
  return (
    <>
      <Navbar />
      <div className={styles.wrapper}>
        {/* Left Section */}
        <div className={styles.leftSection}>
          <a onClick={handleBack} className={styles.backLink}>
            {step === 1
              ? "← Go back to plans"
              : step === 2
              ? "← Go back to personal details"
              : "← Go back to medical history"}
          </a>

          {/* ===== Heading + Stepper Row ===== */}
          <div className={styles.headingStepper}>
            <h2 className={styles.heading}>
              {step === 1
                ? "Personal details"
                : step === 2
                ? "Medical history"
                : "Contact details"}
            </h2>

            <div className={styles.stepper}>
              <div
                className={`${styles.step} ${
                  step >= 1 ? styles.completed : ""
                }`}
              >
                {step > 1 ? "✓" : "1"}
              </div>
              <div className={styles.line} />
              <div
                className={`${styles.step} ${
                  step === 2 ? styles.active : step > 2 ? styles.completed : ""
                }`}
              >
                {step > 2 ? "✓" : "2"}
              </div>
              <div className={styles.line} />
              <div
                className={`${styles.step} ${step === 3 ? styles.active : ""}`}
              >
                3
              </div>
            </div>
          </div>

          {/* Step Content */}
          {step === 1 && (
            <>
              <div className={styles.travellerInfo}>
                <span className={styles.travellerTitle}>
                  Traveller 1 (19 yrs)
                </span>
              </div>

              <form className={styles.form}>
                <div className={styles.row}>
                  <div className={styles.formGroup}>
                    <label>Full Name</label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      onInput={handleNameInput}
                    />{" "}
                  </div>
                  <div className={styles.formGroup}>
                    <label>Gender</label>
                    <div className={styles.genderBtns}>
                      <button type="button" className={styles.genderBtn}>
                        <FaMale className={styles.genderIcon} /> Male
                      </button>
                      <button type="button" className={styles.genderBtn}>
                        <FaFemale className={styles.genderIcon} /> Female
                      </button>
                    </div>
                  </div>
                </div>

                <label className={styles.checkbox}>
                  <input type="checkbox" />
                  Don’t have a last name as per the passport
                </label>

                <div className={styles.row}>
                  <div className={styles.formGroup}>
                    <label>Date of Birth</label>
                    <input
                      type="text"
                      placeholder="Enter date of birth (DD-MM-YYYY)"
                      onInput={handleDOBInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.labelgroup1}>Nationality</label>
                    <input type="text" value="Indian" readOnly />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.formGroup}>
                    <label>Passport Number</label>
                    <input
                      type="text"
                      placeholder="Enter passport number"
                      onInput={handlePassportInput}
                    />{" "}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.labelgroup}>
                      Select Visa Type
                    </label>
                    <div className={styles.selectWrapper}>
                      <select>
                        <option>Tourist/Visitor Visa</option>
                      </select>
                      <FiChevronDown className={styles.selectIcon} />
                    </div>
                  </div>
                </div>

                <p className={styles.helper}>
                  Don’t remember your passport number?
                  <br /> Get the form completion link on
                  <span className={styles.whatsapp}> WhatsApp</span>
                </p>

                <div className={styles.row}>
                  <div className={styles.formGroup}>
                    <label>PAN Number</label>
                    <input
                      type="text"
                      placeholder="Enter pan number"
                      onInput={handlePanInput}
                    />{" "}
                  </div>
                  <div className={styles.formGroup}>
                    <label>Mobile Number</label>
                    <div className={styles.phoneWrapper}>
                      <input
                        type="text"
                        placeholder="Mobile number"
                        onInput={handleMobileInput}
                      />{" "}
                    </div>
                  </div>
                </div>

                <label className={styles.checkbox}>
                  <input type="checkbox" />I don’t have a pancard
                </label>

                <p className={styles.helperNote}>
                  📌 We will share the policy copy on this number
                </p>

                <div className={styles.row}>
                  <div className={styles.formGroup}>
                    <input
                      type="text"
                      placeholder="Enter nominee full name"
                      onInput={handleNameInput}
                    />{" "}
                  </div>
                  <div className={styles.formGroup}>
                    <div className={styles.selectWrapper}>
                      <select>
                        <option>Select nominee relation</option>
                      </select>
                      <FiChevronDown className={styles.selectIcon} />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.continueBtn}
                  onClick={() => setStep(2)}
                >
                  Continue
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <div className={styles.medicalBox}>
              <p className={styles.subHeading}>
                Does any of the traveller(s) have pre-existing medical
                conditions?
              </p>
              <p className={styles.helper}>
                Select YES if any of the traveller(s) have health issues for
                which they need to take regular medication as part of the
                long-term treatment.
              </p>

              <div className={styles.radioGroup}>
                <label className={styles.radioOption}>
                  <input type="radio" name="medical" />
                  Yes
                </label>
                <label className={styles.radioOption}>
                  <input type="radio" name="medical" defaultChecked />
                  No
                </label>
              </div>

              <button
                type="button"
                className={styles.continueBtn}
                onClick={() => setStep(3)}
              >
                Continue
              </button>
            </div>
          )}

          {step === 3 && (
            <div className={styles.contactBox}>
              <p className={styles.helper}>
                We will send the policy copy on this number{" "}
                <strong>+91 98*****456</strong>{" "}
                <a href="#" className={styles.editLink}>
                  ✎ Edit
                </a>
              </p>

              <p className={styles.travellerTitle}>Asd Asd (30 yrs)</p>

              <form className={styles.form}>
                <div className={styles.row}>
                  <div className={styles.formGroup}>
                    <label>Email</label>
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
                  <div className={styles.formGroup}>
                    <label>Pincode</label>
                    <input
                      type="tel"
                      placeholder="Enter your pincode"
                      value={pincode}
                      onChange={handlePincodeChange}
                      maxLength={6}
                      className={styles.input}
                    />
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.formGroup}>
                    <label>City</label>
                    <input type="text" placeholder="Select city" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Address</label>
                    <input type="text" placeholder="Enter address" />
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.formGroup}>
                    <label>Alternate Number</label>
                    <div className={styles.phoneWrapper}>
                      <input
                        type="text"
                        placeholder="Mobile number"
                        onInput={handleMobileInput}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.checkboxGroup}>
                  <label className={styles.checkbox}>
                    <input type="checkbox" /> I declare that nominee is of 18
                    years of age
                  </label>
                  <label className={styles.checkbox}>
                    <input type="checkbox" /> I hereby declare that information
                    provided above is true, and I accept all{" "}
                    <a href="#" className={styles.link}>
                      Terms & Conditions
                    </a>
                  </label>
                  <label className={styles.checkbox}>
                    <input type="checkbox" /> I hereby consent to receive
                    information from Central KYC Registry through SMS/email
                  </label>
                </div>

                <button type="submit" className={styles.payNowBtn}>
                  Pay Now
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className={styles.rightSection}>
          <h3 className={styles.summaryHeading}>Premium Summary</h3>

          <div className={styles.summaryBox}>
            <div className={styles.summaryHeader}>
              <span>Trip Details</span>
              <FiChevronDown />
            </div>

            <div className={styles.planBox}>
              <p className={styles.planTitle}>Plan for: Traveller 1 (19 yrs)</p>
              <div className={styles.planDetails}>
                <Image
                  src={tataLogo}
                  alt="Tata AIG"
                  className={styles.planLogo}
                />
                <div>
                  <p className={styles.planName}>
                    International Plus Gold Without Sublimit
                  </p>
                  <p className={styles.planSum}>Sum Insured: $250,000</p>
                </div>
              </div>
              <div className={styles.premium}>
                <p>Premium</p>
                <p>₹2,677/-</p>
              </div>
            </div>

            <hr />

            <div className={styles.totalBox}>
              <span>TOTAL PREMIUM</span>
              <span className={styles.totalPrice}>₹2,677/-</span>
            </div>
            <p className={styles.gstNote}>(GST included)</p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PersonalDetails;
