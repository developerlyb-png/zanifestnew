import React from "react";




import styles from "@/styles/components/ui/Footer.module.css";
import Image from "next/image";
import Link from "next/link";
import { FaLinkedin, FaInstagram, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { BsFacebook } from "react-icons/bs";
const LIST = [
  {
    head: "Health Insurance",
    links: [
      { name: "Family Floater Health Insurance", url: "health/healthinsurance" },
      { name: "Critical Illness Cover", url: "#" },
      { name: "Personal Accident Policy", url: "#" },
    ],
  },
  {
    head: "Motor Insurance",
    links: [
      { name: "Car Insurance", url: "/carinsurance/carinsurance" },
      { name: "Two Wheeler Insurance", url: "/TwoWheeler/bikeinsurance" },
      { name: "Pay as you Drive", url: "#" },
      { name: "Third Party Insurance", url: "/ThirdParty/Thirdparty1" },
      { name: "Commercial Vehicle Insurance", url: "/CommercialVehicle/CommercialVehicle1" },
    ],
  },
  {
    head: "Other Insurance",
    links: [
      { name: "International Travel Insurance", url: "/Travel/Travel1" },
      { name: "Home Insurance", url: "/Home/Homeinsurance" },
      { name: "Home Loan Insurance", url: "#" },
      { name: "Director & Officer Insurance", url: "#" },
      { name: "Transit Insurance (Marine)", url: "Marine/Marine1" },
      { name: "CPM Insurance", url: "#" },
      { name: "Contractor All Risk Insurance", url: "#" },
    ],
  },
];

function Footer() {
  return (
    <div className={styles.cont}>
      <div className={styles.top}>
        
        {/* Logo + Description */}
        <div className={styles.list}>
          <div className={styles.head}>
            <Image
              src={require("@/assets/logowhite.png")}
              alt="logo"
              className={styles.logoImage}
            />
          </div>

          <div className={styles.desc}>
            The Zanifest insurance broker is India’s Leading insurance broker
            having its operations Pan India. With customised insurance
            solutions to dedicated claim assistance team, we offer you a
            complete peace of mind.
          </div>
<br />

          {/* ✅ Structured Company Info (No layout change) */}
          <div className={styles.desc}>
            <strong>Zanifest Insurance Broker Private Limited</strong><br />
            <strong>CIN :</strong> U66220PB2025PTC063559<br />
            <strong>License category :</strong> Insurance Broker Direct (General)<br />
            <strong>Registration No :</strong> 1119<br />
            <strong>Registration Code :</strong> IRDAI/INT/BRK/DB1242/2025<br />
            <strong>Valid Till :</strong> 27/11/2028
          </div>

          <div className={styles.desc}>
            <strong>Customer Care Email :</strong>{" "}
            <a
  href="mailto:support@zanifestinsurance.com"
  style={{ color: "orange" }}
>
  support@zanifestinsurance.com
</a>
            <br />
            <strong>Tel  :</strong> 01762-496934
          </div>

         <div className={styles.icons}>

  {/* Instagram */}
  <a
    href="https://www.instagram.com/zanifestinsurance?igsh=MWN2bXp1MngxN2JoMA%3D%3D"
    target="_blank"
    rel="noopener noreferrer"
  >
    <FaInstagram size={30} color="#fff" />
  </a>

  {/* YouTube */}
  <a
    href="https://youtube.com/@zanifestinsurance?si=qeoR8nGF2vM9qSLu"
    target="_blank"
    rel="noopener noreferrer"
  >
    <FaYoutube size={30} color="#fff" />
  </a>

  {/* LinkedIn */}
  <a
    href="https://www.linkedin.com/company/zanifest-insurance-broker-pvt-ltd/"
    target="_blank"
    rel="noopener noreferrer"
  >
    <FaLinkedin size={30} color="#fff"/>
  </a>

  {/* Facebook (link mile to yaha daal dena) */}
  <a href="https://www.facebook.com/people/Zanifest-Insurance/61587951775182/?rdid=ugTU8cAvrghxwvyw&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F18a9DHo2th%2F" target="_blank" rel="noopener noreferrer">
    <BsFacebook size={30} color="#fff" />
  </a>

 {/* Twitter / X */}
  <a href="#" target="_blank" rel="noopener noreferrer">
    <FaXTwitter size={30} color="#fff" />
  </a>

</div>
        </div>

        {/* Dynamic Footer Links */}
        {LIST.map((item, index) => (
          <div key={index} className={styles.list}>
            <div className={styles.heading}>{item.head}</div>

            <div className={styles.linksList}>
              {item.links.map((link, i) => (
                <div key={link.name + i} className={styles.link}>
                  <Link href={link.url} className={styles.atag}>
                    {link.name}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}

      </div>

      {/* Footer Bottom */}
      <div className={styles.footerBottomWrapper}>
        <div className={styles.bottomItem}>
          © 2026 Zanifest, All Rights Reserved.
        </div>

        <span className={styles.bottomLinks}>
          <Link href="/Refundpolicy" className={styles.bottomItem}>
            Refund Policy
          </Link>

          <span className={styles.break}>|</span>

          <Link href="/Privacypolicy" className={styles.bottomItem}>
            Privacy Policy
          </Link>

          <span className={styles.break}>|</span>

          <Link href="/Termscondition" className={styles.bottomItem}>
            Terms & Conditions
          </Link>
        </span>
      </div>
    </div>
  );
}

export default Footer;
