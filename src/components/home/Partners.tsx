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

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error("Failed to fetch partners");
    }
    return res.json();
  });

const Partners: React.FC<PartnersProps> = ({
  liveHeading,
  liveImages,
}) => {
  const { data } = useSWR<PartnersApiResponse>(
    "/api/partnersApi",
    fetcher
  );

  const [selectedCategory, setSelectedCategory] =
    useState<Category>(CATEGORYLIST[0]);

  const [heading, setHeading] = useState<string>("Insurance Partner");
  const [partners, setPartners] = useState<string[]>([]);
  const [animate, setAnimate] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // ================= HEADING LOGIC =================

  useEffect(() => {
    if (liveHeading?.trim()) {
      setHeading(liveHeading);
      return;
    }

    if (data) {
      const catData = data.categories?.find(
        (item) => item.category === selectedCategory.name
      );

      if (catData?.heading?.trim()) {
        setHeading(catData.heading);
      } else {
        setHeading("Insurance Partner");
      }
    }
  }, [data, selectedCategory, liveHeading]);

  // ================= PARTNER IMAGES =================

  useEffect(() => {
    if (liveImages !== undefined) {
      setPartners(liveImages);
      return;
    }

    if (data) {
      const catData = data.categories?.find(
        (item) => item.category === selectedCategory.name
      );

      setPartners(catData?.images ?? []);
    }
  }, [liveImages, selectedCategory, data]);

  // ================= SECTION ANIMATION =================

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setAnimate(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, []);

  // ================= AOS INITIALIZATION =================

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  // ================= MOBILE AUTO SLIDER =================

  useEffect(() => {
    const slider = sliderRef.current;

    if (!slider || partners.length <= 1) return;

    let interval: ReturnType<typeof setInterval> | undefined;
    let resumeTimeout: ReturnType<typeof setTimeout> | undefined;

    const isMobile = () => window.innerWidth <= 768;

    const stopSlider = () => {
      if (interval) {
        clearInterval(interval);
        interval = undefined;
      }
    };

    const startSlider = () => {
      stopSlider();

      if (!isMobile()) return;

      interval = setInterval(() => {
        if (!slider || slider.scrollWidth <= slider.clientWidth) {
          return;
        }

        const maxScroll =
          slider.scrollWidth - slider.clientWidth;

        const nextScroll = slider.scrollLeft + 105;

        if (nextScroll >= maxScroll - 5) {
          slider.scrollTo({
            left: 0,
            behavior: "smooth",
          });
        } else {
          slider.scrollTo({
            left: nextScroll,
            behavior: "smooth",
          });
        }
      }, 2200);
    };

    const handleInteraction = () => {
      stopSlider();

      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
      }

      resumeTimeout = setTimeout(() => {
        startSlider();
      }, 3000);
    };

    slider.addEventListener("touchstart", handleInteraction, {
      passive: true,
    });
    slider.addEventListener("pointerdown", handleInteraction);
    slider.addEventListener("mouseenter", stopSlider);
    slider.addEventListener("mouseleave", startSlider);

    startSlider();

    window.addEventListener("resize", startSlider);

    return () => {
      stopSlider();

      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
      }

      slider.removeEventListener("touchstart", handleInteraction);
      slider.removeEventListener("pointerdown", handleInteraction);
      slider.removeEventListener("mouseenter", stopSlider);
      slider.removeEventListener("mouseleave", startSlider);

      window.removeEventListener("resize", startSlider);
    };
  }, [partners, selectedCategory]);

  // ================= HEADING TEXT =================

  const headingWords = heading.trim().split(/\s+/);
  const headingMain = headingWords.slice(0, -1).join(" ");
  const headingLast = headingWords.slice(-1).join("");

  return (
    <div ref={sectionRef} className={styles.cont}>
      {/* ================= HEADING ================= */}

      <div className={styles.head} data-aos="fade-up">
        <p
          className={`${styles.heading} ${
            animate ? styles.animate : ""
          }`}
        >
          {headingMain}{" "}
          <span className={styles.orange}>{headingLast}</span>
        </p>
      </div>

      {/* ================= CONTENT ================= */}

      <div className={styles.bottom}>
        {/* DESKTOP CATEGORY LIST */}

        <div className={styles.catList}>
          {CATEGORYLIST.map((item) => (
            <div
              key={item.name}
              className={styles.catItem}
              onClick={() => setSelectedCategory(item)}
              role="button"
              tabIndex={0}
              aria-pressed={selectedCategory.name === item.name}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault();
                  setSelectedCategory(item);
                }
              }}
              style={{
                backgroundColor:
                  selectedCategory.name === item.name
                    ? "#dcf1ff"
                    : "",
                borderLeft:
                  selectedCategory.name === item.name
                    ? "4px solid #4991c9"
                    : "none",
              }}
            >
              <Image
                src={item.icon}
                alt={item.name}
                width={40}
                height={40}
              />

              <p className={styles.catName}>{item.name}</p>
            </div>
          ))}
        </div>

        {/* ================= MOBILE CATEGORY TABS ================= */}

        <div className={styles.mobileTabs}>
          {CATEGORYLIST.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`${styles.mobileTab} ${
                selectedCategory.name === item.name
                  ? styles.active
                  : ""
              }`}
              onClick={() => setSelectedCategory(item)}
              aria-pressed={selectedCategory.name === item.name}
            >
              {item.name.replace(" Insurance", "")}
            </button>
          ))}
        </div>

        {/* ================= PARTNER LOGOS ================= */}

        <div
          ref={sliderRef}
          className={styles.partList}
          aria-label={`${selectedCategory.name} partners`}
        >
          {partners.length > 0 ? (
            partners.map((img, index) => (
              <div
                key={`${selectedCategory.name}-${index}-${img}`}
                className={styles.partItem}
              >
                <Image
                  src={img}
                  alt={`${selectedCategory.name} partner ${index + 1}`}
                  width={120}
                  height={80}
                  className={styles.imagePartner}
                  unoptimized={
                    typeof img === "string" &&
                    (img.startsWith("http://") ||
                      img.startsWith("https://"))
                  }
                />
              </div>
            ))
          ) : (
            <p className={styles.empty}>
              No partners added yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Partners;