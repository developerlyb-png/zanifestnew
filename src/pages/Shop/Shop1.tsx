"use client";
import React, { useEffect, useState } from "react";
import styles from "@/styles/pages/Shop/shop1.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AOS from "aos";
import "aos/dist/aos.css";
import shopIllustration from "@/assets/pageImages/fire_insurance.png";
import digit from "@/assets/pageImages/digit.png";
import reliance from "@/assets/pageImages/reliance.png";
import chola from "@/assets/home/chola ms.png";
import future from "@/assets/pageImages/insurance.png";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { IoLogoWhatsapp } from "react-icons/io";

const Shop1: React.FC = () => {
  const [mobileNumber, setMobileNumber] = useState("+91 ");
  const [pincode, setPincode] = useState("");
  const [shopType, setShopType] = useState<"rented" | "owned">("rented");
  const router = useRouter();

  const handleMobileNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const prefix = "+91 ";
    if (!input.startsWith(prefix)) {
      setMobileNumber(prefix);
      return;
    }
    const digitsOnly = input.substring(prefix.length).replace(/[^0-9]/g, "");
    const limitedDigits = digitsOnly.slice(0, 10);
    setMobileNumber(prefix + limitedDigits);
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(input);
  };

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  // ✅ Handle Next Button Click
  const handleNext = () => {
    const shopData = {
      shopType,
      pincode,
      phone: mobileNumber.replace("+91 ", ""), // remove prefix
    };

    // Save data temporarily to localStorage
    localStorage.setItem("shopDataStep1", JSON.stringify(shopData));

    router.push("Shop2");
  };

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {/* LEFT SECTION */}
        <div className={styles.left}>
          <p className={styles.subHeading}>Shop Insurance</p>
          <h1 className={styles.heading}>
            Get <span className={styles.highlight}>₹50 Lakh</span> cover
            starting at just{" "}
            <span className={styles.highlightRed}>₹3,400/year</span>
            <sup>+</sup>
          </h1>

          <ul className={styles.features}>
            <li>Fire & Natural Disaster</li>
            <li>Theft within 7 days of Peril Occurrence</li>
          </ul>

          <div className={styles.middle}>
            <Image
              src={shopIllustration}
              alt="Shop Fire Insurance Illustration"
              className={styles.illustration}
            />

            <div className={styles.partnersBox}>
              <p className={styles.partnerHeading}>10+ insurance partners</p>
              <div className={styles.partnersGrid}>
                <div className={styles.partner}>
                  <Image src={digit} alt="Digit" />
                </div>
                <div className={styles.partner}>
                  <Image src={reliance} alt="Reliance" />
                </div>
                <div className={styles.partner}>
                  <Image src={chola} alt="Chola MS" />
                </div>
                <div className={styles.partner}>
                  <Image src={future} alt="Future Generali" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className={styles.right} data-aos="fade-left">
          <h2 className={styles.formHeading}>Get free quotes in 30 seconds</h2>

          <div className={styles.radioGroup}>
            <label>
              <input
                type="radio"
                name="shopType"
                value="rented"
                checked={shopType === "rented"}
                onChange={() => setShopType("rented")}
              />
              Rented Shop
            </label>
            <label>
              <input
                type="radio"
                name="shopType"
                value="owned"
                checked={shopType === "owned"}
                onChange={() => setShopType("owned")}
              />
              Owned Shop
            </label>
          </div>

          <input
            type="tel"
            placeholder="Enter your shop pincode"
            value={pincode}
            onChange={handlePincodeChange}
            maxLength={6}
            className={styles.input}
          />

          <input
            type="tel"
            placeholder="Mobile number"
            value={mobileNumber}
            onChange={handleMobileNumberChange}
            maxLength={14}
            className={styles.input}
          />

          <button className={styles.cta} onClick={handleNext}>
            View Free Quotes
          </button>

          <div className={styles.whatsapp}>
            Get updates on WhatsApp
            <IoLogoWhatsapp className={styles.whatsappIcon} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Shop1;
