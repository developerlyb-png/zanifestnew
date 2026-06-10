"use client";

import Image, { type StaticImageData } from "next/image";
import { useState } from "react";
import styles from "@/styles/about/herosection.module.css";
import Navbar from "@/components/ui/Navbar";
import aboutBg from "@/assets/About/about.png";
import logo from "@/assets/logo.png";
import layer10 from "@/assets/About/Layer 10.png";
import layer11 from "@/assets/About/Layer 11.png";
import layer14 from "@/assets/About/Layer 14.png";
import layer23 from "@/assets/About/Layer 23.png";
import mandeep from "@/assets/contact/Mandeep.jpeg";
import naresh from "@/assets/contact/Naresh.jpeg";
import mayak from "@/assets/contact/mayakthakur.jpeg";
import { ZodArray } from "zod";
import { FaShieldAlt, FaUsers, FaSmile, FaChartLine } from "react-icons/fa";
import Footer from "@/components/ui/Footer";


type ProfileKey = "mandeep" | "naresh" | "mayak";

import { ReactNode } from "react";

type Profile = {
  name: string;
  img: StaticImageData;
  text: ReactNode; // ✅ FIX
};


export default function AboutPage() {
  const [active, setActive] = useState<ProfileKey>("mandeep");
const profiles: Record<ProfileKey, Profile> = {
mandeep: {
  name: "Mandeep Rathee",
  img: mandeep,
  text: (
    <>
      <strong>Mandeep Rathee</strong> is the Founder and CEO of{" "}
      <strong>Zanifest Insurance Broker Pvt Ltd</strong>. He is a{" "}
      <strong>Science Graduate</strong> from Hindu College and later completed a{" "}
      <strong>Business Management</strong> degree from GJU, Hisar. His professional
      qualifications also include <strong>Licentiate</strong> in General Insurance
      from <strong>III</strong> and an advanced certification in{" "}
      <strong>Product Management</strong> from <strong>IIT Guwahati</strong>.
      <br />
      <br/>
      He has worked with leading corporates for more than two decades, starting his
      career as a Management Trainee with <strong>Red Bull</strong> Energy Drink in
      2005. Over the years, his professional journey took him through different
      organizations like <strong>Bharti AXA</strong> General Insurance,{" "}
      <strong>HDFC ERGO</strong>, and <strong>ICICI Lombard</strong> General
      Insurance, where he spent nearly 20 years in the general insurance space. His experience spans over simple motor, health, and travel insurance to complex corporate and large project policies.
      <br />
      <br/>
      He has successfully led a team of over 100 professionals and managed
      insurance Bancassurance business for two largest private sector banks,{" "}
      <strong>ICICI</strong> and <strong>HDFC</strong> for North India.
    </>
  )
},


naresh: {
  name: "Naresh Dhiman",
  img: naresh,
  text: (
    <>
      <strong>Naresh Dhiman</strong> is a Director of{" "}
      <strong>Zanifest Insurance Broker</strong>, based in{" "}
      <strong>Bilaspur, Himachal Pradesh</strong>. He is a{" "}
      <strong>Business Graduate</strong> and also holds a{" "}
      <strong>Postgraduate degree</strong> from <strong>IMS, Shimla</strong>. With
      over <strong>20 years of experience</strong>, Naresh has successfully
      handled diverse businesses across insurance companies, dealer networks, and
      start-up ventures.
      <br />
      <br />
      Throughout his career, he has worked with reputed organizations such as{" "}
      <strong>Shriram General Insurance</strong> as a Senior Branch Manager,{" "}
      <strong>Bharti AXA </strong>General Insurance,{" "}
      <strong>Bajaj Allianz General Insurance</strong>, and has also managed the{" "}
      <strong>Mahindra dealer network</strong> across{" "}
      <strong>Himachal Pradesh</strong>. In addition, he has been a founder of an{" "}
      <strong>FMCG start-up</strong>, giving him hands-on entrepreneurial
      experience alongside corporate exposure.
      <br />
      <br />
      Naresh is passionate about interacting with people and enjoys discussing{" "}
      <strong>innovative business ideas</strong>. An{" "}
      <strong>avid traveller and explorer</strong>, he brings{" "}
      <strong>strong business acumen</strong> and{" "}
      <strong>leadership capability</strong>, handling large business volumes with
      efficiency and ease.
    </>
  ),
},


  mayak: {
    name: "Mayank Thakur",
    img: mayak,
    text: (
      <>
     <strong>Mayank Thakur</strong> is a Director of the company, based in <strong>Dehradun</strong>. He brings with him extensive <strong>experience of 22 years</strong>, out of which 18 years have been dedicated to the general insurance industry. He is a Commerce <strong>postgraduate</strong> from <strong>DAV College</strong>, Dehradun, and has also completed a Diploma in Information Technology from <strong>Sikkim Manipal University</strong>.
     <br/>

Professionally, Mayank has worked with leading insurance organizations such as ICICI Lombard, Reliance General Insurance,<strong> Bharti AXA</strong> General Insurance, and the  <strong>Royal Sundaram Group</strong>. He has handled the Uttar Pradesh and Uttarakhand regions extensively and possesses deep expertise across retail insurance, bancassurance, and corporate insurance domains.
<br/>
An <strong>industry veteran</strong>, Mayank is known for his strong operational knowledge and people-centric approach. He is currently focused on building an honest, credible, and customer-friendly insurance organization from the ground up. Outside of work, Mayank enjoys <strong>trekking</strong> and{" "}
      <strong>driving in the hills</strong>, plays{" "}
      <strong>badminton</strong>, loves listening to{" "}
      <strong>music</strong>, and—like most Indians—is a true{" "}
      <strong>tea enthusiast</strong>.
</>
    ),
  }
};


  const current = profiles[active];
  return (
    <>
    <Navbar/>
    <section className={styles.hero}>
      {/* Background */}
     <Image
  src={aboutBg}
  alt="About Background"
  fill
  priority
  sizes="100vw"
  className={styles.bgImage}
/>


      {/* Color overlay (NO heavy blur) */}
      <div className={styles.overlay}></div>

      {/* Center Card */}
      <div className={styles.card}>
        <Image
          src={logo}
          alt="Zanifest Logo"
          width={500}   // 🔥 LOGO BIG
          height={110}
          className={styles.logo}
        />

        <p className={styles.text}>
          Redefining Insurance experiences by creating a seamless, engaging,
          and inclusive platform that brings people together, removes
          complexity, and ensures everyone can easily discover, access,
          and enjoy meaningful moments without barriers.
        </p>
      </div>
    </section>
        <section className={styles.aboutSection}>
        <div className={styles.aboutContainer}>
          
          {/* LEFT : IMAGES */}
          <div className={styles.imageStack}>
            <Image
              src={layer11}
              alt="Team discussion"
              className={styles.imageBack}
            />
            <Image
              src={layer10}
              alt="Business meeting"
              className={styles.imageFront}
            />
          </div>

          {/* RIGHT : TEXT */}
          <div className={styles.aboutContent}>
            <span className={styles.aboutTag}>ABOUT COMPANY</span>

            <h2 className={styles.aboutTitle}>
              Creating a better <br /> future for your loved <br /> ones
            </h2>

            <p className={styles.aboutDesc}>
              Zanifest Insurance Broking is born to realize the dream of
              helping people by mitigating their risks and providing honest
              and most effective insurance solutions. Over the years, we
              discovered serious challenges in the insurance ecosystem.
              There is widespread mis-selling, service delays, and finding
              credible, trustworthy advice has become extremely difficult.
              Trust issues exist – and rightly so.
            </p>
          </div>
        </div>
      </section>
        {/* ===== VISION / MISSION SECTION ===== */}
      <section className={styles.vmSection}>
        <div className={styles.vmContainer}>

          {/* LEFT IMAGE */}
          <div className={styles.vmLeft}>
            <Image
              src={layer14}
              alt="Vision Mission Values"
              className={styles.vmHex}
            />
          </div>

          {/* RIGHT CONTENT */}
        <div className={styles.vmRight}>

  {/* Vision */}
  <div className={styles.vmCard}>
    <Image src={layer23} alt="" className={styles.vmBg} />
    <div className={styles.vmTextWrap}>
      <h3 className={styles.vmTitle}>Vision</h3>
      <p className={styles.vmText}>
        To become the most honest and transparent insurance provider of India.
        We wish to be known as an institution of choice for our commitment and
        fair business practices – ensuring Zanifest Insurance Broker becomes
        the most honest and best insurance broker of India.
      </p>
    </div>
  </div>

  {/* Mission */}
  <div className={styles.vmCard}>
    <Image src={layer23} alt="" className={styles.vmBg} />
    <div className={styles.vmTextWrap}>
      <h3 className={styles.vmTitle}>Mission</h3>
      <p className={styles.vmText}>
        Wish to become a trusted insurance provider in the insurance field.
        We want to cover all houses, business premises, projects, vehicles,
        travellers, employees, and individuals to live a sustainable,
        worry-free life.
      </p>
    </div>
  </div>

  {/* Values */}
  <div className={styles.vmCard}>
    <Image src={layer23} alt="" className={styles.vmBg} />
    <div className={styles.vmTextWrap}>
      <h3 className={styles.vmTitle}>Values</h3>
      <p className={styles.vmText}>
        At Zanifest, we strongly believe in upholding four core values for our
        business:
      </p>

     <div className={styles.valuesInline}>
  <span>★ <strong>Honesty</strong></span>
  <span>★ <strong>Integrity</strong></span>
  <span>★ <strong>Customer Centricity</strong></span>
  <span>★ <strong>Compassion</strong></span>
</div>

    </div>
  </div>

</div>

        </div>
      </section>
       
      {/* ================= LEADERSHIP ================= */}
<section className={styles.leaderSection}>
  {/* Tabs */}
  <div className={styles.tabs}>
    {(Object.keys(profiles) as ProfileKey[]).map((key) => (
      <button
        key={key}
        className={`${styles.tab} ${active === key ? styles.activeTab : ""}`}
        onClick={() => setActive(key)}
      >
        {profiles[key].name}
      </button>
    ))}
  </div>

  {/* Content */}
  <div className={styles.leaderContent}>
    {/* Left Image */}
<div className={styles.leaderImage}>
  <div className={styles.leaderImageWrap}>
    <Image
      src={current.img}
      alt={current.name}
      priority
    />

    {/* DESKTOP ONLY DESIGNATION */}
    <p className={styles.desktopLeaderRole}>
      {active === "mandeep" && "Founder & CEO"}
      {active === "naresh" && "Director"}
      {active === "mayak" && "Director"}
    </p>
  </div>

  {/* MOBILE ONLY (already working) */}
  <div className={styles.mobileLeaderInfo}>
    <h4 className={styles.mobileLeaderName}>{current.name}</h4>
    <p className={styles.mobileLeaderRole}>
      {active === "mandeep" && "Founder & CEO"}
      {active === "naresh" && "Director"}
      {active === "mayak" && "Director"}
    </p>
  </div>
</div>




    {/* Right Text */}
    <div className={styles.leaderText}>
      <p>{current.text}</p>
    </div>
  </div>

  {/* Stats Bar */}
  <div className={styles.statsBar}>
    <div className={styles.statItem}>
      <FaShieldAlt className={styles.statIcon} />
      <div className={styles.statText}>
        <h3>2.6k</h3>
        <span>Gave insurances</span>
      </div>
    </div>

    <div className={styles.statItem}>
      <FaUsers className={styles.statIcon} />
      <div className={styles.statText}>
        <h3>89+</h3>
        <span>Professional team</span>
      </div>
    </div>

    <div className={styles.statItem}>
      <FaSmile className={styles.statIcon} />
      <div className={styles.statText}>
        <h3>2.8k</h3>
        <span>Satisfied customers</span>
      </div>
    </div>

    <div className={styles.statItem}>
      <FaChartLine className={styles.statIcon} />
      <div className={styles.statText}>
        <h3>99%</h3>
        <span>Our success rate</span>
      </div>
    </div>
  </div>
</section>
<Footer/>

    </>
  );
}
