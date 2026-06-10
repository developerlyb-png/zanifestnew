"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "@/styles/components/home/DemoSection.module.css";
import { FaEllipsisH } from "react-icons/fa";
import useSWR from "swr";
import axios from "axios";
import "aos/dist/aos.css";
import AOS from "aos";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const DEMOLIST = [
  {
    name: "Over 9 Million",
    desc: "Customers trust us and have bought their insurance on Zanifest",
    image: "/assets/home/demo/1.png",
    color: "#e7f9f7",
  },
  {
    name: "50+ Insurers",
    desc: "Partnered with us so that you can compare easily & transparently",
    image: "/assets/home/demo/2.png",
    color: "#ebf2f8",
  },
  {
    name: "Great Price",
    desc: "Affordable plans for all types of insurance",
    image: "/assets/home/demo/3.png",
    color: "#f9e5e2",
  },
  {
    name: "Claims",
    desc: "Support built in with every policy for help, when you need it",
    image: "/assets/home/demo/4.png",
    color: "#faf6e2",
  },
];
const limitText = (text: string, limit = 90) => {
  if (!text) return "";
  return text.length > limit ? text.slice(0, limit).trim() + "…" : text;
};

const parseHeading = (text: string) => {
  const regex = /<([^>]+)>/g;
  const parts: { text: string; isTag: boolean }[] = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), isTag: false });
    }
    parts.push({ text: match[1].trim(), isTag: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), isTag: false });
  }
  return parts;
};

function DemoSection() {
  const { data } = useSWR("/api/demoapi", fetcher);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [animateHeading, setAnimateHeading] = useState(false);

  // Trigger animation only when section enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setAnimateHeading(true);
          observer.disconnect();
        }
      },
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  const heading =
    data?.heading || "Why is <ZANIFEST> India’s go-to for insurance?";
  const subheading =
    data?.subheading ||
    "Zanifest is your trusted partner in insurance — providing transparent comparisons, affordable policies, and dedicated support.";
  const items = data?.items || DEMOLIST;

  useEffect(() => {
              AOS.init({ duration: 1000, once: true }); 
  },[]);

  return (
    <div ref={sectionRef} className={styles.cont}>
      <div className={styles.head}  data-aos="fade-up"
          data-aos-duration="1000"
          data-aos-easing="ease-in">
        <div
          className={`${styles.heading} ${
            animateHeading ? styles.animateOnce : ""
          }`}
        >
          {parseHeading(heading).map((part, idx) => (
            <span
              key={idx}
              style={{
                color: part.isTag ? "orangered" : "black",
                whiteSpace: "pre-wrap",
              }}
            >
              {part.text}
            </span>
          ))}
        </div>

        <div className={styles.mobileEllipsis}>
          <FaEllipsisH style={{ color: "#fa621a", fontSize: "25px" }} />
        </div>

      </div>
        <div className={styles.subHeading}>{subheading}</div>

      <div className={styles.list}>
        {items.map((item: any, index: number) => (
          <div key={index} className={styles.item}>
            <div
              className={styles.imageCont}
              style={{ backgroundColor: item.color }}
            >
              {item.image ? (
                <Image
                  src={item.image}
                  alt="icon"
                  className={styles.image}
                  width={60}
                  height={60}
                />
              ) : (
                <div
                  style={{
                    width: 60,
                    height: 60,
                    background: item.color,
                    borderRadius: "50%",
                  }}
                ></div>
              )}
            </div>
            <div className={styles.content}>
              <p className={styles.name}>{item.name}</p>
<p className={styles.desc}>
  {limitText(item.desc, 90)}
</p>            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DemoSection;
