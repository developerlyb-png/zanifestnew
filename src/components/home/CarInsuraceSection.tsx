"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaEllipsisH } from "react-icons/fa";
import useSWR from "swr";
import styles from "@/styles/components/home/CarInsuranceSection.module.css";
import "aos/dist/aos.css";
import AOS from "aos";

type Item = {
  name: string;
  image: any;
  link: string;
};

const INSURANCELIST: Item[] = [
  { name: "Family Health Insurance", image: require("@/assets/home/car/1.png"), link: "./health/healthinsurance" },
  { name: "Marine Insurance", image: require("@/assets/ship.png"), link: "./Marine/Marine1" },
  { name: "Travel Insurance", image: require("@/assets/airplane.png"), link: "./Travel/Travel1" },
  { name: "Car Insurance", image: require("@/assets/home/car/4.png"), link: "./carinsurance/carinsurance" },
  { name: "⁠2 wheeler Insurance", image: require("@/assets/home/car/5.png"), link: "./TwoWheeler/bikeinsurance" },
  { name: "Shop Insurance", image: require("@/assets/shops.png"), link: "./Shop/Shop1" },
  { name: "Third Party Insurance", image: require("@/assets/home/car/7.png"), link: "./ThirdParty/Thirdparty1" },
  { name: "Commercial Vehicle", image: require("@/assets/3d-truck.png"), link: "./CommercialVehicle/CommercialVehicle1" },
  { name: "Home Insurance", image: require("@/assets/home/car/9.png"), link: "./Home/Homeinsurance" },
  { name: "Office Package Policy", image: require("@/assets/office-building.png"), link: "./officepackagepolicy/officepackagepolicy" },
  { name: "Doctor Indemnity Insurance", image: require("@/assets/medical-team.png"), link: "./DoctorInd/DoctorInsurance" },
  { name: "Director & Officer Liability Insurance", image: require("@/assets/workspace.png"), link: "DirectorOfficerLiabilityInsurance/DirectorInsurance1" },
];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Parse heading to highlight text inside <>
const parseHeading = (text: string) => {
  const regex = /<([^>]+)>/g;
  const parts: { text: string; isTag: boolean }[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), isTag: false });
    }
    parts.push({ text: match[1], isTag: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), isTag: false });
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
  const router = useRouter();
  const { data } = useSWR("/api/carinsuranceapi", fetcher);

  const heading = initialHeading ?? data?.heading ?? "Click to buy an Insurance";
  const order: string[] = initialOrder ?? data?.order ?? INSURANCELIST.map((it) => it.name);

  const orderedList: Item[] = order
    .map((name) => INSURANCELIST.find((it) => it.name === name))
    .filter(Boolean) as Item[];

  // 👇 Fade-in animation on scroll
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setAnimate(true);
          observer.disconnect();
        }
      },
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  
    useEffect(() => {
                AOS.init({ duration: 1000, once: true }); 
    },[]);

  return (
    <div ref={sectionRef} className={`${styles.cont} ${animate ? styles.animateOnce : ""}`}>
      <div className={styles.head}  data-aos="fade-up"
          data-aos-duration="1000"
          data-aos-easing="ease-in">
        <div className={styles.heading}>
          {parseHeading(heading).map((part, idx) => (
            <span key={idx} style={{ color: part.isTag ? "orangered" : "black" }}>
              {part.text}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.mobileEllipsis}>
        <FaEllipsisH style={{ color: "#fa621a", fontSize: "25px" }} />
      </div>

      <div className={styles.list}>
        {orderedList.map((item, index) => (
          <div
            className={styles.item}
            key={index}
            onClick={() => {
              router.push(item.link);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <div className={styles.top}>
              <div className={styles.imageCont}>
                <Image src={item.image} alt={item.name} className={styles.image} />
              </div>
            </div>
            <div className={styles.bottom}>{item.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
