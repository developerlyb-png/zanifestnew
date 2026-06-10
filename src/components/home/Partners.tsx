"use client";

import React, { useEffect, useState, useRef } from "react";
import styles from "@/styles/components/home/Partners.module.css";
import Image, { StaticImageData } from "next/image";
import useSWR from "swr";
import "aos/dist/aos.css";
import AOS from "aos";

import img1 from "@/assets/home/car/1.png";
import img2 from "@/assets/home/car/2.png";
import img3 from "@/assets/home/car/6.png";

interface Category {
  name: string;
  icon: StaticImageData;
}

interface PartnerCategory {
  category: string;
  heading?: string;
  images: string[];
}

interface PartnersApiResponse {
  categories: PartnerCategory[];
}

interface PartnersProps {
  liveHeading?: string;
  liveImages?: string[];
}

const CATEGORYLIST: Category[] = [
  { name: "Health Insurance", icon: img1 },
  { name: "Motor Insurance", icon: img2 },
  { name: "Fire Insurance", icon: img3 },
];

const fetcher = (url: string) => fetch(url).then(res => res.json());

const Partners: React.FC<PartnersProps> = ({ liveHeading, liveImages }) => {
  const { data } = useSWR<PartnersApiResponse>("/api/partnersApi", fetcher);

  const [selectedCategory, setSelectedCategory] = useState<Category>(CATEGORYLIST[0]);

  // ✅ DEFAULT HEADING — kabhi gayab nahi hogi
  const [heading, setHeading] = useState<string>("Insurance Partner");

  const [partners, setPartners] = useState<string[]>([]);
  const [animate, setAnimate] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // ================= HEADING LOGIC (FINAL & SAFE) =================
  useEffect(() => {
    // 1️⃣ Admin live preview (highest priority)
    if (liveHeading && liveHeading.trim() !== "") {
      setHeading(liveHeading);
      return;
    }

    // 2️⃣ From API (category-wise)
    if (data) {
      const catData = data.categories.find(
        c => c.category === selectedCategory.name
      );

      // ⚠️ Empty ho to overwrite mat karo
      if (catData?.heading && catData.heading.trim() !== "") {
        setHeading(catData.heading);
      }
    }
    // else → default heading rehne do

  }, [data, selectedCategory, liveHeading]);

  // ================= PARTNER IMAGES =================
  useEffect(() => {
    if (liveImages !== undefined) {
      setPartners(liveImages);
    } else if (data) {
      const catData = data.categories.find(
        c => c.category === selectedCategory.name
      );
      setPartners(catData?.images ?? []);
    }
  }, [liveImages, selectedCategory, data]);

  // ================= ANIMATION =================
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setAnimate(true);
          observer.unobserve(entry.target);
        }
      });
    });



    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  // ================= AOS INIT =================

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <div ref={sectionRef} className={styles.cont}>
      {/* ================= HEADING ================= */}
      <div className={styles.head} data-aos="fade-up">
        <p className={`${styles.heading} ${animate ? styles.animate : ""}`}>
          {heading.split(" ").slice(0, -1).join(" ")}{" "}
          <span className={styles.orange}>
            {heading.split(" ").slice(-1)}
          </span>
        </p>
      </div>

      {/* ================= CONTENT ================= */}
      <div className={styles.bottom}>
        {/* Categories */}
        <div className={styles.catList}>
          {CATEGORYLIST.map((item, index) => (
            <div
              key={index}
              className={styles.catItem}
              onClick={() => setSelectedCategory(item)}
              style={{
                backgroundColor:
                  selectedCategory.name === item.name ? "#dcf1ff" : "",
                borderLeft:
                  selectedCategory.name === item.name
                    ? "4px solid #4991c9"
                    : "none",
              }}
            >
              <Image src={item.icon} alt={item.name} width={40} height={40} />
              <p className={styles.catName}>{item.name}</p>
            </div>
          ))}
        </div>
        {/* ===== MOBILE TABS (ONLY MOBILE) ===== */}
<div className={styles.mobileTabs}>
  {CATEGORYLIST.map((item, index) => (
    <button
      key={index}
      className={`${styles.mobileTab} ${
        selectedCategory.name === item.name ? styles.active : ""
      }`}
      onClick={() => setSelectedCategory(item)}
    >
      {item.name.replace(" Insurance", "")}
    </button>
  ))}
</div>
       {/* Partners */}
        <div className={styles.partList}>
          {partners.length > 0 ? (
            partners.map((img, index) => (
              <div key={index} className={styles.partItem}>
                <Image
                  src={img}
                  alt={`partner-${index}`}
                  width={120}
                  height={80}
                  className={styles.imagePartner}
                />
              </div>
            ))
          ) : (
            <p style={{ padding: "20px", color: "#999" }}>
              No partners added yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Partners;
