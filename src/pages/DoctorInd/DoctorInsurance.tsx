"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "@/styles/pages/DoctorInd/doctorinsurance.module.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import UserDetails from "@/components/ui/UserDetails";
import manager from "@/assets/doctor/stethoscope.png";
import axios from "axios";
import AOS from "aos";
import "aos/dist/aos.css";

const DoctorInsurance: React.FC = () => {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("+91 ");
  const [whatsapp, setWhatsapp] = useState(true);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post("/api/doctorinsurance", {
        name,
        mobile,
        whatsapp,
      });

      if (res.data.success) {
        localStorage.setItem("doctorId", res.data.data._id);
        alert("Data saved successfully");
        router.push("DoctorInsurance2");
      } else {
        alert("Failed to save");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving data");
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = input
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
    setName(formatted);
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const prefix = "+91 ";
    let input = e.target.value;

    if (!input.startsWith(prefix)) input = prefix;

    const digits = input.substring(4).replace(/\D/g, "").slice(0, 10);
    setMobile(prefix + digits);
  };

  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);
  
  return (
    <>
      <UserDetails />
      <Navbar />

      <section className={styles.wrapper}>
        <div className={styles.inner} >
          {/* Left Text Content */}
          <div className={styles.textBlock} data-aos="fade-right">
            <h4 className={styles.subHeading}>
              Professional Indemnity Insurance for Doctors
            </h4>

            <h1 className={styles.title}>
              Get <span className={styles.highlight}>₹1 crore</span> cover starting at
            </h1>

            <div className={styles.priceRow}>
              <span className={styles.price}>₹2,500/year</span>
              <sup className={styles.plus}>+</sup>
            </div>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.inputWrap}>
              <input
                  type="text"
                  placeholder="Enter full name"
                  value={name}
                  onChange={handleNameChange}
                  className={styles.input}
                  autoComplete="name"
                />
                {name && <span className={styles.check}>✔</span>}
              </div>

              <div className={styles.inputWrap}>
              <input
                  type="tel"
                  placeholder="Enter mobile number"
                  value={mobile}
                  onChange={handleMobileChange}
                  className={styles.input}
                  autoComplete="tel"
                  maxLength={14} 
                />
                {mobile.length === 14 && <span className={styles.check}>✔</span>}
              </div>

              <button className={styles.btn} type="submit">
                View plans
              </button>
               
            </form>

            <div className={styles.inlineSmall}>
              <label className={styles.whatsappLabel}>
                <input
                  type="checkbox"
                  checked={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>Get Updates on WhatsApp</span>
              </label>
              <span className={styles.whatsIcon}>💬</span>
            </div>

            <p className={styles.terms}>
              By clicking on "View plans" you agree to our{" "}
              <a href="#" className={styles.link}>
                Privacy Policy
              </a>{" "}
              &{" "}
              <a href="#" className={styles.link}>
                Terms Of Use
              </a>
            </p>

            <div className={styles.features}>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>⚖️</span>
                <p className={styles.featureText}>Medico-Legal Lawyer Panel</p>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>⏱️</span>
                <p className={styles.featureText}>Within 6 hrs Lawyer Allocation</p>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>📑</span>
                <p className={styles.featureText}>10000+ Doctors Covered</p>
              </div>
            </div>
          </div>

          {/* Right Image (hidden on mobile via CSS) */}
          <div className={styles.imageBlock}>
            <Image
              src={manager}
              alt="Stethoscope"
              className={styles.stethoscopeImg}
              priority
            />
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default DoctorInsurance;
