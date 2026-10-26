
"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FaEllipsisH } from "react-icons/fa";
import useSWR from "swr";
import InsuranceInquiryModal from "@/components/ui/InsuranceInquiryModal";
import styles from "@/styles/components/home/CarInsuranceSection.module.css";
import "aos/dist/aos.css";
import AOS from "aos";

type Item = {
  name: string;
  image: any;
  link: string;
};

const INSURANCELIST: Item[] = [
  {
    name: "Family Health Insurance",
    image: require("@/assets/home/car/family.png"),
    link: "./health/healthinsurance",
  },
  {
    name: "Marine Insurance",
    image: require("@/assets/home/car/marine.png"),
    link: "./Marine/Marine1",
  },
  {
    name: "Travel Insurance",
    image: require("@/assets/home/car/travel.png"),
    link: "./Travel/Travel1",
  },
  {
    name: "Car Insurance",
    image: require("@/assets/home/car/car.png"),
    link: "./carinsurance/carinsurance",
  },
  {
    name: "\u20602 wheeler Insurance",
    image: require("@/assets/home/car/two-wheelar.png"),
    link: "./TwoWheeler/bikeinsurance",
  },
  {
    name: "Shop Insurance",
    image: require("@/assets/home/car/shop-ins.png"),
    link: "./Shop/Shop1",
  },
  {
    name: "Third Party Insurance",
    image: require("@/assets/home/car/third-party.png"),
    link: "./ThirdParty/Thirdparty1",
  },
  {
    name: "Commercial Vehicle",
    image: require("@/assets/home/car/commercial.png"),
    link: "./CommercialVehicle/CommercialVehicle1",
  },
  {
    name: "Home Insurance",
    image: require("@/assets/home/car/home-ins.png"),
    link: "./Home/Homeinsurance",
  },
  {
    name: "Office Package Policy",
    image: require("@/assets/home/car/office.png"),
    link: "./officepackagepolicy/officepackagepolicy",
  },
  {
    name: "Doctor Indemnity Insurance",
    image: require("@/assets/home/car/doctor.png"),
    link: "./DoctorInd/DoctorInsurance",
  },
  {
    name: "Director & Officer Liability Insurance",
    image: require("@/assets/home/car/director.png"),
    link: "DirectorOfficerLiabilityInsurance/DirectorInsurance1",
  },
];

const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to load insurance cards");
  }

  return response.json();
};

const cleanName = (name: string) =>
  name.replace(/[\u200B-\u200D\u2060\uFEFF]/g, "").trim();

const normalizeName = (name: string) =>
  cleanName(name).toLowerCase();

const parseHeading = (text: string) => {
  const regex = /<([^>]+)>/g;
  const parts: { text: string; isTag: boolean }[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, match.index),
        isTag: false,
      });
    }

    parts.push({
      text: match[1],
      isTag: true,
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      isTag: false,
    });
  }

  return parts;
};

export default function CarInsuraceSection({
  initialHeading,
  initialOrder,
}: {
  initialHeading?: string;
  initialOrder?: string[];
}) {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const { data } = useSWR("/api/carinsuranceapi", fetcher);

  const heading =
    initialHeading ??
    data?.heading ??
    "Click to buy an Insurance";

  const displayHeading = heading.includes("<Insurance>")
    ? heading
    : heading.replace(/Insurance/i, "<Insurance>");

  const order: string[] =
    initialOrder ??
    data?.order ??
    INSURANCELIST.map((item) => item.name);

  // Keep the supplied order and append any missing cards.
  // Invisible characters in card names are normalized for matching.
  const orderedList: Item[] = (() => {
    const result: Item[] = [];
    const addedNames = new Set<string>();

    order.forEach((name) => {
      const normalized = normalizeName(name);

      const matchedItem = INSURANCELIST.find(
        (item) => normalizeName(item.name) === normalized
      );

      if (matchedItem && !addedNames.has(normalizeName(matchedItem.name))) {
        result.push(matchedItem);
        addedNames.add(normalizeName(matchedItem.name));
      }
    });

    INSURANCELIST.forEach((item) => {
      const normalized = normalizeName(item.name);

      if (!addedNames.has(normalized)) {
        result.push(item);
        addedNames.add(normalized);
      }
    });

    return result;
  })();

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const element = sectionRef.current;

    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setAnimate(true);
        observer.disconnect();
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    });
  }, []);

  return (
    <div
      ref={sectionRef}
      className={`${styles.cont} ${animate ? styles.animateOnce : ""}`}
    >
      {/* ===== Heading ===== */}
      <div
        className={styles.head}
        data-aos="fade-up"
        data-aos-duration="800"
      >
        <div className={styles.heading}>
          {parseHeading(displayHeading).map((part, index) => (
            <span
              key={index}
              className={part.isTag ? styles.highlight : ""}
            >
              {part.text}
            </span>
          ))}
        </div>

        <div className={styles.headingDecoration} aria-hidden="true">
          <span />
          <i />
          <i />
          <i />
          <span />
        </div>
      </div>

      {/* ===== Mobile Decoration ===== */}
      <div className={styles.mobileEllipsis} aria-hidden="true">
        <FaEllipsisH />
      </div>

      {/* ===== All Insurance Cards ===== */}
      <div className={styles.list}>
        {orderedList.map((item, index) => (
          <button
            type="button"
            className={styles.item}
            key={`${normalizeName(item.name)}-${index}`}
            onClick={() => setSelectedProduct(cleanName(item.name))}
          >
            <span className={styles.top}>
              <span className={styles.imageCont}>
                <Image
                  src={item.image}
                  alt={cleanName(item.name)}
                  className={styles.image}
                />
              </span>
            </span>

            <span className={styles.bottom}>
              {cleanName(item.name)}
            </span>

            <span className={styles.cardAccent} aria-hidden="true" />
          </button>
        ))}
      </div>
      {selectedProduct && (
        <InsuranceInquiryModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
