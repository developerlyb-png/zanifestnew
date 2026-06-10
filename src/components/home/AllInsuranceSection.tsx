"use client";

import React, { useRef, useEffect, useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";
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
    image: "/public/assets/home/services/1.png",
    link: "#",
  },
  {
    name: "Travel Insurance",
    desc: "Stay worry-free on your journeys with travel insurance that covers medical emergencies, delays, and unexpected cancellations.",
    image: "/public/assets/home/services/2.png",
    link: "#",
  },
  {
    name: "Home Insurance",
    desc: "Safeguard your home and belongings from natural disasters, theft, and unforeseen events with our reliable home insurance plans.",
    image: "/public/assets/home/services/3.png",
    link: "#",
  },
];

// Function to parse heading and detect <tags>
const parseHeading = (heading: string) => {
  const regex = /<([^>]+)>/g;
  const parts: { text: string; isTag: boolean }[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(heading)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: heading.slice(lastIndex, match.index), isTag: false });
    }
    parts.push({ text: match[1], isTag: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < heading.length) {
    parts.push({ text: heading.slice(lastIndex), isTag: false });
  }

  return parts;
};

interface AllInsuranceSectionProps {
  previewHeading?: string;
  previewServices?: any[];
}

function AllInsuranceSection({ previewHeading, previewServices }: AllInsuranceSectionProps) {
  const { data } = useSWR(!previewHeading ? "/api/allinsuranceapi" : null, fetcher, {
    refreshInterval: 10000,
  });

  const heading =
    previewHeading || data?.heading || "We're Giving all the <Insurance> Services to you";

  const services =
    previewServices && previewServices.length > 0
      ? previewServices
      : data?.services || FALLBACK_SERVICES;

  const headingParts = parseHeading(heading);

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
    AOS.init({ duration: 1000, once: true });
  }, []);

  // Animation based on index
const animationMap = ["fade-right", "fade-up", "fade-left"];

  return (
    <div className={styles.cont}>
      <div
        className={styles.head}
 data-aos="fade-up"
     data-aos-anchor-placement="center-bottom"
             data-aos-duration="1000"
        data-aos-easing="ease-in"
      >
        <div
          ref={headingRef}
          className={`${styles.heading} ${animate ? styles.animateText : ""}`}
        >
          <span className={styles.text}>
            {headingParts.map((part, i) =>
              part.isTag ? (
                <span key={i} className={styles.orange}>
                  {part.text}
                </span>
              ) : (
                <span key={i}>{part.text}</span>
              )
            )}
          </span>
        </div>

        <div className={styles.mobileEllipsis}>
          <FaEllipsisH style={{ color: "#fa621a", fontSize: "25px" }} />
        </div>
      </div>

      {/* Desktop View */}
      <div className={styles.bottom}>
        {services.map((item: any, index: number) => (
          <div
            className={styles.serviceItem}
            key={index}
            data-aos={animationMap[index] || "fade-up"}
  data-aos-duration={animationMap[index] === "fade-up" ? "3000" : undefined}
  data-aos-anchor-placement={animationMap[index] === "fade-up" ? "center-bottom" : undefined}

          >
            <Image
              src={item.image}
              alt={item.name}
              width={100}
              height={100}
              className={styles.image}
            />
            <h2 className={styles.name}>{item.name}</h2>
            <h6 className={styles.desc}>{item.desc}</h6>
            {/* <Link href={item?.link || "#"} className={styles.arrow}>
              <FaArrowRight />
            </Link> */}
          </div>
        ))}
      </div>

      {/* Carousal View */}
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
              <h2 className={styles.name}>{item.name}</h2>
              <h6 className={styles.desc}>{item.desc}</h6>
              {/* <Link href={item?.link || "#"} className={styles.arrow}>
                <FaArrowRight />
              </Link> */}
            </div>
          ))}
        />
      </div>
    </div>  
  );
}

export default AllInsuranceSection;
