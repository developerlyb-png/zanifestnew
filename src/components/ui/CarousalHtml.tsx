"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "@/styles/components/home/FeedBackSection.module.css";

interface CarouselItem {
  desc?: string;
  image?: string;
  name?: string;
  post?: string;
}

interface CarouselProps {
  items?: CarouselItem[];
}

export default function Carousel({ items = [] }: CarouselProps) {
  const [currentItems, setCurrentItems] = useState<CarouselItem[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

  const CARD_WIDTH = 380;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /* ---------------- Setup items safely ---------------- */
  useEffect(() => {
    if (!items.length) {
      setCurrentItems([]);
      return;
    }

    const safeItems = items.filter(Boolean);
    const initial = [...safeItems, ...safeItems.slice(0, 3)];
    setCurrentItems(initial);
  }, [items]);

  /* ---------------- Auto slide ---------------- */
  const startSlider = () => {
    stopSlider();
    intervalRef.current = setInterval(slideNext, 3000);
  };

  const stopSlider = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (currentItems.length > 1) startSlider();
    return () => stopSlider();
  }, [currentItems]);

  /* ---------------- Sliding Logic ---------------- */
  const slideNext = () => {
    if (!trackRef.current || currentItems.length <= 1) return;

    const track = trackRef.current;
    track.style.transition = "transform 0.5s ease-in-out";
    track.style.transform = `translateX(-${CARD_WIDTH}px)`;

    setTimeout(() => {
      track.style.transition = "none";
      track.style.transform = "translateX(0)";

      setCurrentItems((prev) => {
        if (!prev.length) return prev;
        const [first, ...rest] = prev;
        return [...rest, first];
      });
    }, 500);
  };

  /* ---------------- Empty state ---------------- */
  if (!currentItems.length) {
    return null; // or loader / skeleton
  }

  return (
    <div
      className={styles.carouselWrapper}
      onMouseEnter={stopSlider}
      onMouseLeave={startSlider}
    >
      <div className={styles.carouselWindow}>
        <div className={styles.track} ref={trackRef}>
          {currentItems.map((item, index) => (
            <div className={styles.serviceItem} key={index}>
              <h6 className={styles.desc}>{item?.desc || ""}</h6>

              <div className={styles.itemBottom}>
                <Image
                  src={item?.image || "/placeholder.png"}
                  alt={item?.name || "user"}
                  className={styles.image}
                  width={100}
                  height={100}
                />

                <div className={styles.namePost}>
                  <h2 className={styles.name}>{item?.name || ""}</h2>
                  <h2 className={styles.post}>{item?.post || ""}</h2>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
