"use client";

import React, {
  useRef,
  useEffect,
  useState,
} from "react";

import styles from "@/styles/components/home/BestServicesSection.module.css";

import { MdHeadsetMic } from "react-icons/md";
import { LuNotebookPen } from "react-icons/lu";
import { LiaMoneyBillSolid } from "react-icons/lia";
import { FaEllipsisH } from "react-icons/fa";

import "aos/dist/aos.css";
import AOS from "aos";


const iconMap = {
  support: <MdHeadsetMic size={40} />,
  claim: <LuNotebookPen size={40} />,
  installment: <LiaMoneyBillSolid size={40} />,
};

type ServiceType = keyof typeof iconMap;

interface ServiceItem {
  name: string;
  desc: string;
  type: ServiceType;
}

interface BestServicesSectionProps {
  liveHeading?: string;
  liveServices?: ServiceItem[];
}


/* ================= DEFAULT CONTENT ================= */

const DEFAULT_HEADING =
  "<Service> That Puts You First";


const LIST_FALLBACK: ServiceItem[] = [
  {
    name: "Always-On Support",
    desc:
      "Questions don't follow office hours. Whether it's midnight or midday, our digital support tools and dedicated agents are here to guide you.",
    type: "support",
  },
  {
    name: "Seamless Claims Assistance",
    desc:
      "Facing a crisis? We handle the heavy lifting. Our team assists you with documentation and filing to ensure your claims are processed quickly.",
    type: "claim",
  },
  {
    name: "Flexible Payment Options",
    desc:
      "Don't let budget stops you from being protected. Choose from convenient monthly EMI plans that fit your finances effortlessly.",
    type: "installment",
  },
];


/* ================= HEADING PARSER ================= */

const parseHeading = (text: string) => {
  const regex = /<([^>]+)>/g;

  const parts: {
    text: string;
    isTag: boolean;
  }[] = [];

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        text: text.slice(
          lastIndex,
          match.index
        ),
        isTag: false,
      });
    }

    parts.push({
      text: match[1],
      isTag: true,
    });

    lastIndex =
      match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      isTag: false,
    });
  }

  return parts;
};


/* ================= COMPONENT ================= */

export default function BestServicesSection({
  liveHeading,
  liveServices,
}: BestServicesSectionProps) {

  const heading =
    liveHeading || DEFAULT_HEADING;


  const serviceList =
    liveServices &&
    liveServices.length > 0
      ? liveServices
      : LIST_FALLBACK;


  const sectionRef =
    useRef<HTMLDivElement>(null);


  const [visible, setVisible] =
    useState(false);


  /* ================= SCROLL ANIMATION ================= */

  useEffect(() => {
    const observer =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {

            if (entry.isIntersecting) {
              setVisible(true);
              observer.disconnect();
            }

          });
        }
      );


    if (sectionRef.current) {
      observer.observe(
        sectionRef.current
      );
    }


    return () => {
      observer.disconnect();
    };

  }, []);


  /* ================= AOS ================= */

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);


  return (
    <div
      ref={sectionRef}
      className={styles.cont}
    >

      {/* ================= HEADING ================= */}

      <div
        className={`${styles.head} ${
          visible
            ? styles.animateOnce
            : ""
        }`}
        data-aos="fade-up"
        data-aos-duration="1000"
        data-aos-easing="ease-in"
      >

        <h1
          className={styles.heading1}
          data-aos="fade-up"
        >

          {parseHeading(
            heading
          ).map(
            (part, idx) => (

              <span
                key={idx}
                style={{
                  color: part.isTag
                    ? "#1876bd"
                    : "#17384f",
                }}
              >
                {part.text}
              </span>

            )
          )}

        </h1>


        {/* ================= MOBILE ELLIPSIS ================= */}

        <div
          className={
            styles.mobileEllipsis
          }
        >

          <FaEllipsisH
            style={{
              color: "#1876bd",
              fontSize: "25px",
            }}
          />

        </div>

      </div>


      {/* ================= SERVICES LIST ================= */}

      <div className={styles.list}>

        {serviceList.map(
          (item, index) => (

            <div
              className={`${styles.item} ${
                visible
                  ? styles.animateOnce
                  : ""
              }`}
              key={
                item.type +
                "-" +
                index
              }
              style={{
                animationDelay:
                  `${0.2 * index}s`,
              }}
            >

              {/* ================= ICON ================= */}

              <div
                className={`${styles.imageCont} ${styles.selected}`}
              >
                {iconMap[item.type]}
              </div>


              {/* ================= CONTENT ================= */}

              <div
                className={styles.content}
              >

                <p
                  className={styles.name}
                >
                  {item.name}
                </p>


                <p
                  className={styles.desc}
                >
                  {item.desc}
                </p>

              </div>

            </div>

          )
        )}

      </div>

    </div>
  );
}