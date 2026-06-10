"use client";

import React, { useState } from "react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import styles from "@/styles/contact/contactus.module.css";
import Image from "next/image";
import contactImage from "@/assets/contact/cont.png";

const ThankYouModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="overlay">
      <div className="modal">
        <button className="closeBtn" onClick={onClose}>✕</button>

        <div className="icon">✓</div>

        <h2>THANK YOU</h2>
        <p>We have received your message and will be in touch shortly.</p>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }

        .modal {
          background: #fff;
          padding: 40px;
          border-radius: 12px;
          width: 420px;
          text-align: center;
          position: relative;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          animation: fadeIn 0.3s ease;
        }

        .closeBtn {
          position: absolute;
          right: 15px;
          top: 15px;
          border: none;
          background: none;
          font-size: 18px;
          cursor: pointer;
        }

        .icon {
          width: 60px;
          height: 60px;
          background: #16a34a;
          color: white;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 28px;
          margin: 0 auto 20px;
        }

        h2 {
          color: #0b3c5d;
          margin-bottom: 10px;
          letter-spacing: 1px;
        }

        p {
          color: #555;
          line-height: 1.5;
        }

        @keyframes fadeIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const ContactPage = () => {

  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;

    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      form.reset();
      setShowModal(true);
    } else {
      alert("Something went wrong ❌");
    }
  };

  return (
    <>
      <Navbar />

      {/* IMAGE SECTION */}
      <section className={styles.carousel}>
        <Image
          src={contactImage}
          alt="Contact Zanifest Insurance"
          fill
          priority
          className={styles.singleImage}
        />

        <div className={styles.imageOverlay}></div>

        <div className={styles.carouselText}>
          <h1 className={styles.contactTitle}>CONTACT Us</h1>
        </div>
      </section>

      <div className={styles.carouselTexts}>
        <p className={styles.heroPara}>
          At Zanifest, we believe insurance should be a promise kept, not a hassle endured.
          Founded with a vision to simplify financial protection for every Indian, we bridge
          the gap between complex insurance terms and your peace of mind.
        </p>

        <p className={styles.subLine}>
          Have questions about a policy or need help with a claim? Our team is ready to assist you.
        </p>
      </div>

      {/* CONTACT SECTION */}
      <section className={styles.contactSection}>
        <div className={styles.container}>
          <div className={styles.grid}>

            <div className={styles.card}>
              <h2>Get in Touch with Zanifest</h2>

              <form onSubmit={handleSubmit}>
                <input name="name" type="text" placeholder="Full Name" required />
                <input name="email" type="email" placeholder="Email Address" required />
                <input name="phone" type="tel" placeholder="Phone Number" />
                <textarea name="message" rows={4} placeholder="Your Message" required />
                <button type="submit">Send Message</button>
              </form>
            </div>

            <div className={styles.card}>
              <h2>Contact Information</h2>

              <div className={styles.detailBox}>
                <span>📞 Customer Support</span>
                <p>+91 1762 496 934</p>
              </div>

              <div className={styles.detailBox}>
                <span>📧 Customer Support Email</span>
                <p>support@zanifestinsurance.com</p>
              </div>

              <div className={styles.detailBox}>
                <span>🏢 Grievance Support Email</span>
                <p>mandeep.rathee@zanifestinsurance.com</p>
              </div>

              <div className={styles.detailBox}>
                <span>🏢 Address</span>
                <p>
                  Zanifest Insurance Broker Pvt Ltd, SCF-8, 1st Floor, Old Ambala Road,
                  Dhakoli, Zirakpur, Distt Mohali, Punjab-140603
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* THANK YOU MODAL */}
      <ThankYouModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />

      <Footer />
    </>
  );
};

export default ContactPage;