"use client";

import React, { useRef, useEffect, useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { FaEllipsisH } from "react-icons/fa";
import SingleHtmlCarousal from "../ui/SingleIHtmlCarousal";
import styles from "@/styles/components/home/AllInsuranceSection.module.css";
import "aos/dist/aos.css";
import AOS from "aos";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const FALLBACK_SERVICES = [
  {
    name: "Family Insurance",
    desc: "Protect your loved ones with comprehensive family coverage designed to secure health, future, and peace of mind.",
    image: "/assets/home/services/1.png",
    link: "#",
  },
  {
    name: "Travel Insurance",
    desc: "Stay worry-free on your journeys with travel insurance that covers medical emergencies, delays, and unexpected cancellations.",
    image: "/assets/home/services/2.png",
    link: "#",
  },
  {
    name: "Home Insurance",
    desc: "Safeguard your home and belongings from natural disasters, theft, and unforeseen events with our reliable home insurance plans.",
    image: "/assets/home/services/3.png",
    link: "#",
  },
];

interface AllInsuranceSectionProps {
  previewHeading?: string;
  previewServices?: any[];
}

function AllInsuranceSection({
  previewHeading,
  previewServices,
}: AllInsuranceSectionProps) {
  const { data } = useSWR(
    !previewHeading ? "/api/allinsuranceapi" : null,
    fetcher,
    {
      refreshInterval: 10000,
    }
  );

  const heading =
    previewHeading ||
    data?.heading ||
    "We're Giving all the <Insurance> Services to you";

  const services =
    previewServices && previewServices.length > 0
      ? previewServices
      : data?.services || FALLBACK_SERVICES;

  const headingRef = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setAnimate(true);
          observer.disconnect();
        }
      });
    });

    if (headingRef.current) {
      observer.observe(headingRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  const animationMap = ["fade-right", "fade-up", "fade-left"];

  // ==========================================
  // HEADING RENDER
  // <Insurance> OR normal Insurance
  // dono cases me orange hoga
  // ==========================================
  const renderHeading = (text: string) => {
    // <Insurance> remove karke Insurance ko highlight karenge
    const cleanText = text.replace(/<([^>]+)>/g, "$1");

    // Insurance word split
    const parts = cleanText.split(/(insurance)/gi);

    return parts.map((part, index) => {
      if (part.toLowerCase() === "insurance") {
        return (
          <span key={index} className={styles.orange}>
            {part}
          </span>
        );
      }

      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  return (
    <div className={styles.cont}>
      {/* ================= HEADING ================= */}

      <div
        className={styles.head}
        data-aos="fade-up"
        data-aos-anchor-placement="center-bottom"
        data-aos-duration="1000"
        data-aos-easing="ease-in"
      >
        <div
          ref={headingRef}
          className={`${styles.heading} ${
            animate ? styles.animateText : ""
          }`}
        >
          <span className={styles.text}>
            {renderHeading(heading)}
          </span>
        </div>

        <div className={styles.mobileEllipsis}>
          <FaEllipsisH
            style={{
              color: "#fa621a",
              fontSize: "25px",
            }}
          />
        </div>
      </div>

      {/* ================= DESKTOP VIEW ================= */}

      <div className={styles.bottom}>
        {services.map((item: any, index: number) => (
          <div
            className={styles.serviceItem}
            key={index}
            data-aos={animationMap[index] || "fade-up"}
            data-aos-duration={
              animationMap[index] === "fade-up"
                ? "3000"
                : undefined
            }
            data-aos-anchor-placement={
              animationMap[index] === "fade-up"
                ? "center-bottom"
                : undefined
            }
          >
            <Image
              src={item.image}
              alt={item.name}
              width={100}
              height={100}
              className={styles.image}
            />

            <h2 className={styles.name}>
              {item.name}
            </h2>

            <h6 className={styles.desc}>
              {item.desc}
            </h6>
          </div>
        ))}
      </div>

      {/* ================= CAROUSEL VIEW ================= */}

      <div className={styles.bottomCarousal}>
        <SingleHtmlCarousal
          items={services.map((item: any, index: number) => (
            <div
              className={styles.serviceItem}
              key={index}
              data-aos={animationMap[index] || "fade-up"}
            >
              <Image
                src={item.image}
                alt={item.name}
                width={100}
                height={100}
                className={styles.image}
              />

              <h2 className={styles.name}>
                {item.name}
              </h2>

              <h6 className={styles.desc}>
                {item.desc}
              </h6>
            </div>
          ))}
        />
      </div>
    </div>
  );
}

export default AllInsuranceSection;