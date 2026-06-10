"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import useSWR from "swr";
import { IFeedbackItem } from "@/models/feedback";
import Carousel from "../ui/CarousalHtml";
import FeedbackMobile from "../ui/FeedbackMobile";
import styles from "@/styles/components/home/FeedBackSection.module.css";
import { FaEllipsisH } from "react-icons/fa";
import "aos/dist/aos.css";
import AOS from "aos";

interface IFeedbackApiResponse {
  success: boolean;
  data: IFeedbackItem[];
  heading?: string;
  message?: string;
}

interface FeedBackSectionProps {
  liveHeading?: string;
  liveFeedbackList?: IFeedbackItem[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// 🔹 Helper to render heading with <...> styled
const renderHeading = (heading: string) => {
  const parts = heading.split(/(<[^>]+>)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("<") && part.endsWith(">")) {
      return (
        <span key={idx} className={styles.orange}>
          {part.replace(/[<>]/g, "")}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
};

const FeedBackSection: React.FC<FeedBackSectionProps> = ({
  liveHeading,
  liveFeedbackList,
}) => {
  const { data, error, isLoading } = useSWR<IFeedbackApiResponse>(
    liveHeading || liveFeedbackList ? null : "/api/feedback",
    fetcher,
    { refreshInterval: 5000 }
  );

  const [feedbackList, setFeedbackList] = useState<IFeedbackItem[]>([]);
  const [heading, setHeading] = useState("What Our <Customers> Are Saying?");

  // 🔸 Optional: intersection-based fade-in trigger for extra CSS animation
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [animateheading, setAnimateheading] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setAnimateheading(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // 🔸 Initialize AOS
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    AOS.refresh();
  }, []);

  // 🔸 Handle heading and data from props or SWR
  useEffect(() => {
    if (liveHeading) setHeading(liveHeading);
    else if (data?.heading) setHeading(data.heading);

    if (liveFeedbackList) setFeedbackList(liveFeedbackList);
    else if (data?.success && data.data) setFeedbackList(data.data);
  }, [liveHeading, liveFeedbackList, data]);

  // Loading / error states
  if (!liveHeading && !liveFeedbackList) {
    if (isLoading) return <div className={styles.cont}>Loading Feedback...</div>;
    if (error) return <div className={styles.cont}>Failed to load feedback.</div>;
    if (!data?.success || !data.data)
      return <div className={styles.cont}>No feedback available.</div>;
  }

  //  Build slides
  const slides = feedbackList.map((item, index) => (
    <div className={styles.serviceItem} key={String(item._id ?? index)}>
      <h6 className={styles.desc}>{item.desc}</h6>
      <div className={styles.itemBottom}>
        <Image
          src={item.image}
          alt={item.name}
          width={50}
          height={50}
          unoptimized
          className={styles.image}
        />
        <div className={styles.namePost}>
          <h2 className={styles.name}>{item.name}</h2>
          <h2 className={styles.post}>{item.post}</h2>
        </div>
      </div>
    </div>
  ));

  // Render
  return (
    <div ref={sectionRef} className={styles.cont}>
      <div className={styles.head}  data-aos="fade-up"
          data-aos-duration="1000"
          data-aos-easing="ease-in">
        <div
          className={`${styles.heading} ${
            animateheading ? styles.animateOnce : ""
          }`}
         
        >
          {renderHeading(heading)}
        </div>
      </div>

      <div className={styles.mobileEllipsis}>
        <FaEllipsisH style={{ color: "#fa621a", fontSize: "25px" }} />
      </div>

      <div className={styles.bottom}>
        {/* Mobile Carousel */}
        <div className={styles.singlecar}>
          <FeedbackMobile items={slides} />
        </div>

        {/* Desktop Carousel */}
        <div className={styles.multicar}>
          <Carousel items={feedbackList} />
        </div>
      </div>
    </div>
  );
};

export default FeedBackSection;
