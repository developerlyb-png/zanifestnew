"use client";
import React, { useState } from "react";
import styles from "@/styles/pages/Home/homeinsurance4.module.css";
import Image from "next/image";
import { FaLock, FaInfoCircle } from "react-icons/fa";
import chola from "@/assets/home/chola ms.png";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

const Homeinsurance4: React.FC = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");

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
        {/* Back link */}
        <div className={styles.backLink}>← Back to quotes</div>

        {/* Stepper */}
        <div className={styles.stepWrapper}>
          <div className={styles.step}>
            <div
              className={`${styles.circle} ${
                step === 1 ? styles.active : step > 1 ? styles.complete : ""
              }`}
            >
              {step > 1 ? "✓" : ""}
            </div>
            <div className={styles.stepDetails}>
              <span className={styles.stepTitle}>STEP 1</span>
              <span
                className={
                  step === 1
                    ? styles.stepSub
                    : step > 1
                    ? styles.stepComplete
                    : styles.stepInactive
                }
              >
                Personal details
              </span>
            </div>
          </div>

          <div className={styles.line}></div>

          <div className={styles.step}>
            <div
              className={`${styles.circle} ${
                step === 2 ? styles.active : step > 2 ? styles.complete : ""
              }`}
            >
              {step > 2 ? "✓" : ""}
            </div>
            <div className={styles.stepDetails}>
              <span className={styles.stepTitle}>STEP 2</span>
              <span
                className={
                  step === 2
                    ? styles.stepSub
                    : step > 2
                    ? styles.stepComplete
                    : styles.stepInactive
                }
              >
                Property address
              </span>
            </div>
          </div>
        </div>

        {/* Main Container */}
        <div className={styles.container}>
          {/* LEFT: changes by step */}
          <div className={styles.left}>
            {step === 1 && (
              <>
                <h2 className={styles.heading}>Home owner details</h2>
                <div className={styles.form}>
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label>Salutation</label>
                      <select>
                        <option>Mr</option>
                        <option>Ms</option>
                        <option>Mrs</option>
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label>Full name (as per PAN card for KYC)</label>
                      <input type="text" value="Asad" />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label>Date of birth (as per PAN card for KYC)</label>
                      <input type="date" />
                    </div>
                    <div className={styles.field}>
                      <label>Mobile number</label>
                      <input type="text" value="XXXXXX7845" />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.fieldFull}>
                      <label>Email ID</label>
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
                  </div>

                  {/* Content Bifurcation */}
                  <div className={styles.contentBox}>
                    <label>
                      Content Bifurcation{" "}
                      <FaInfoCircle className={styles.infoIcon} />
                    </label>
                    <div className={styles.row}>
                      <div className={styles.field}>
                        <div className={styles.inputWithIcon}>
                          <input
                            type="text"
                            value="6,66,667"
                            placeholder="Content Value"
                            readOnly
                          />
                          <FaLock className={styles.lockIcon} />
                        </div>
                        <small>
                          Rs. Six lakh sixty six thousand six hundred sixty
                          seven only
                        </small>
                      </div>
                      <div className={styles.field}>
                        <input type="text" placeholder="Electronics" />
                      </div>
                    </div>
                    <div className={styles.row}>
                      <div className={styles.field}>
                        <input type="text" placeholder="Furniture & fixture" />
                      </div>
                      <div className={styles.field}>
                        <input type="text" placeholder="Other" />
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  className={styles.continueBtn}
                  onClick={() => setStep(2)}
                >
                  CONTINUE
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className={styles.heading}>Property address</h2>
                <div className={styles.form}>
                  <div className={styles.row}>
                    <input type="text" placeholder="Address line 1" />
                    <input type="text" placeholder="Address line 2" />
                  </div>
                  <div className={styles.row}>
                    <input type="text" value="Kutch" />
                    <input type="text" value="370001" />
                  </div>
                  <div className={styles.row}>
                    <input type="text" placeholder="Carpet Area(sqft)" />
                    <select>
                      <option>Building type</option>
                      <option>Independent house</option>
                      <option>Apartment</option>
                    </select>
                  </div>

                  <div className={styles.helper}>
                    <span>Not sure about carpet area?</span>
                    <a href="#">Calculate here</a>
                  </div>

                  <div className={styles.checkbox}>
                    <input type="checkbox" defaultChecked /> My communication
                    address is same as property address.
                  </div>
                  <div className={styles.checkbox}>
                    <input type="checkbox" /> I have a loan against my property
                    (Bank Hypothecation)
                  </div>
                </div>

                <button className={styles.continueBtn}>CONTINUE</button>
              </>
            )}
          </div>

          {/* RIGHT SUMMARY always visible */}
          <div className={styles.right}>
            <div className={styles.summaryCard}>
              <h3 className={styles.summarytext}>Summary</h3>
              <div className={styles.summaryHeader}>
                <Image src={chola} alt="logo" className={styles.logo} />
                <div className={styles.policyTitle}>Bharat Griha Raksha</div>
              </div>

              <div className={styles.summaryContent}>
                <div className={styles.row}>
                  <span>Sum insured</span>
                  <span className={styles.amount}>₹ 40,00,000</span>
                </div>
                <a href="#" className={styles.link}>
                  Premium Breakup -
                </a>

                <div className={styles.breakup}>
                  <div className={styles.row}>
                    <span>Premium</span>
                    <span>₹ 7,000</span>
                  </div>
                  <div className={styles.row}>
                    <span>GST</span>
                    <span>₹ 1,260</span>
                  </div>
                </div>

                <div className={styles.totalRow}>
                  <span>Total premium to be paid</span>
                  <span className={styles.total}>₹ 8,260</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Homeinsurance4;
