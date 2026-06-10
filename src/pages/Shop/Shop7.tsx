"use client";
import React from "react";
import styles from "@/styles/pages/Shop/shop7.module.css";
import { FaArrowLeft } from "react-icons/fa";
import { FaRupeeSign } from "react-icons/fa";
import { MdPending } from "react-icons/md";
import { FaRegIdCard } from "react-icons/fa";
import { FaUpload } from "react-icons/fa";
import { HiIdentification } from "react-icons/hi";
import Image from "next/image";
import shriram from "@/assets/CommercialVehicle/shriram.png"
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { useRouter } from "next/navigation";

const Shop7: React.FC = () => {
        const router = useRouter();
  
  return (
    <>
    <Navbar/>
    <div className={styles.container}>
      {/* Back Button */}
      <button className={styles.backButton}  onClick={() => router.push("Shop6")}>
        <FaArrowLeft />
      </button>

      {/* Plan Card */}
      <div className={styles.planCard}>
        <Image
          src={shriram}
          alt="Shriram Logo"
          className={styles.logo}
          height={40}
          width={90}
        />
        <div className={styles.planDetails}>
          <p className={styles.planName}>Plan name</p>
          <h4 className={styles.planTitle}>Shri Shopkeeper Package</h4>
        </div>
        <div className={styles.planAmount}>
          <p>Sum insured</p>
          <h4>₹ 5,00,000</h4>
        </div>
        <div className={styles.planAmount}>
          <p>Premium</p>
          <h4>₹ 590</h4>
        </div>
      </div>

      {/* Documents Section */}
      <div className={styles.docsCard}>
        <h3 className={styles.docsHeading}>Documents required</h3>
        <p className={styles.docsSubtext}>
          The sooner you upload, the sooner you get a policy
        </p>

        {/* PAN Card */}
        <div className={styles.docItem}>
          <div className={styles.docLeft}>
            <FaRegIdCard className={styles.docIcon} />
            <span>PAN card *</span>
          </div>
          <div className={styles.docRight}>
            <button className={styles.uploadBtn}>
              <FaUpload /> Upload
            </button>
            <div className={styles.pending}>
              <MdPending /> Pending
            </div>
          </div>
        </div>

        {/* GST / Registration Certificate */}
        <div className={styles.docItem}>
          <div className={styles.docLeft}>
            <HiIdentification className={styles.docIcon} />
            <span>GST or any registration certificate *</span>
          </div>
          <div className={styles.docRight}>
            <button className={styles.uploadBtn}>
              <FaUpload /> Upload
            </button>
            <div className={styles.pending}>
              <MdPending /> Pending
            </div>
          </div>
        </div>

        {/* Proceed Button */}
        <button className={styles.proceedBtn}>Proceed to payment</button>
      </div>
    </div>
    <Footer/>
    </>
  );
};

export default Shop7;
