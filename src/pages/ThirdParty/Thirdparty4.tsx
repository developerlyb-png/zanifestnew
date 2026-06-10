"use client";
import React, { useState } from "react";
import styles from "@/styles/pages/Thirdparty/thirdparty4.module.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import Image from "next/image";
import { BiSolidBank } from "react-icons/bi";
import { FaMoneyBillWave, FaWallet, FaCheck, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { MdCreditCard } from "react-icons/md";
import { BsCreditCard2BackFill } from "react-icons/bs";
import { GiTakeMyMoney } from "react-icons/gi";


// Bank Logos
import hdfc from "@/assets/pageImages/hdfc.png";
import icici from "@/assets/pageImages/Icici.png";
import sbi from "@/assets/pageImages/sbi.png";
import punjab from "@/assets/pageImages/punjab.png";
import kotak from "@/assets/pageImages/KOTAKBANK.png";
import baroda from "@/assets/pageImages/baroda.png";

// Company Logo
import zurich from "@/assets/pageImages/zurich kotak.png";

const ThirdParty4 = () => {
  const [activeOption, setActiveOption] = useState("NetBanking");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const paymentOptions = [
    { name: "NetBanking", icon: <BiSolidBank className={styles.paymentIcon} /> },
    { name: "UPI", icon: <FaMoneyBillWave className={styles.icon} /> },
    { name: "Credit Card", icon: <BsCreditCard2BackFill className={styles.icon} /> },
    { name: "Debit Card", icon: <MdCreditCard className={styles.icon} /> },
    { name: "Wallet", icon: <FaWallet className={styles.icon} /> },
    { name: "EMI", icon: <GiTakeMyMoney className={styles.icon} /> },
  ];

  return (
    <div>
      <Navbar />

      <div className={styles.wrapper}>
        {/* Progress Bar */}
        <div className={styles.progressBarWrapper}>
          <div className={styles.progressBar}>
            <div className={`${styles.step} ${styles.active}`}>
              <div className={styles.circle}>
                <FaCheck size={10} color="#fff" />
              </div>
              <span>Payment Mode</span>
            </div>
            <div className={styles.step}>
              <div className={styles.circle}></div>
              <span>Payment Complete</span>
            </div>
          </div>
        </div>

        <div className={styles.container}>
          {/* LEFT SIDE */}
          <div className={styles.left}>
            {/* Desktop Sidebar */}
            <div className={styles.sidebar}>
              {paymentOptions.map((opt) => (
                <div
                  key={opt.name}
                  className={`${styles.option} ${
                    activeOption === opt.name ? styles.active : ""
                  }`}
                  onClick={() => setActiveOption(opt.name)}
                >
                  {opt.icon}
                  <span>{opt.name}</span>
                </div>
              ))}
            </div>

            {/* Mobile Toggle */}
            <div className={styles.mobileToggleWrapper}>
              <div className={styles.mobileToggle}>
                {/* Left side (icon + label) */}
                <div className={styles.mobileToggleLeft}>
                  {paymentOptions.find((o) => o.name === activeOption)?.icon}
                  <span>{activeOption}</span>
                </div>

                {/* Right side (chevron button) */}
                <button
                  className={styles.dropdownIcon}
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>

              {mobileMenuOpen && (
                <div className={styles.mobileDropdown}>
                  {paymentOptions.map((opt) => (
                    <div
                      key={opt.name}
                      className={`${styles.option} ${
                        activeOption === opt.name ? styles.active : ""
                      }`}
                      onClick={() => {
                        setActiveOption(opt.name);
                        setMobileMenuOpen(false);
                      }}
                    >
                      {opt.icon}
                      <span>{opt.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className={styles.mainBox}>
              <div className={styles.notice}>
                <b>State Bank Of India</b> is currently facing some technical issues.
              </div>

              <h3 className={styles.bankHeading}>Select your Bank</h3>

              <div className={styles.bankGrid}>
                <button className={styles.bankBtn}>
                  <Image className={styles.img} src={hdfc} alt="HDFC" />
                  <span>HDFC</span>
                </button>
                <button className={styles.bankBtn}>
                  <Image className={styles.img} src={icici} alt="ICICI" />
                  <span>ICICI</span>
                </button>
                <button className={styles.bankBtn}>
                  <Image className={styles.img} src={sbi} alt="SBI" />
                  <span>SBI</span>
                </button>
                <button className={styles.bankBtn}>
                  <Image className={styles.img} src={kotak} alt="Kotak" />
                  <span>Kotak Mahindra</span>
                </button>
                <button className={styles.bankBtn}>
                  <Image className={styles.img} src={punjab} alt="Punjab National Bank" />
                  <span>Punjab National Bank</span>
                </button>
                <button className={styles.bankBtn}>
                  <Image className={styles.img} src={baroda} alt="Bank of Baroda" />
                  <span>Bank of Baroda</span>
                </button>
              </div>

              <select className={styles.dropdown}>
                <option>Select Another Bank</option>
                <option>Yes Bank</option>
                <option>Axis Bank</option>
                <option>IDFC First Bank</option>
              </select>

              <button className={styles.payNow}>Pay Now</button>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className={styles.right}>
            <div className={styles.orderBox}>
              <div className={`${styles.row} ${styles.orderNumberRow}`}>
                <span className={styles.orderLabel}>Order Number</span>
                <span className={styles.orderValue}>PB135154111</span>
              </div>
              <div className={styles.row}>
                <Image className={styles.orderimg} src={zurich} alt="Zurich Kotak" />
                <span className={styles.price}>₹ 4,031.00</span>
              </div>
              <div className={styles.row}>
                <span className={styles.bold}>Total Premium</span>
                <span className={styles.bold}>₹ 4,031.00</span>
              </div>
            </div>

            <div className={styles.toggleBox}>Plan Details</div>
            <div className={styles.toggleBox}>Proposer Details</div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <a href="#">Privacy Policy</a> | <a href="#">Terms & Conditions</a> |{" "}
          <a href="#">FAQ</a>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ThirdParty4;
