"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "@/styles/components/ui/Carousal.module.css";
import Loader from "@/components/ui/loader";

interface ImageType {
  _id: string;
  title: string;
  imageUrl: string;
}

interface CarouselProps {
  refresh: number;
}

const Carousel: React.FC<CarouselProps> = ({ refresh }) => {
  const [images, setImages] = useState<ImageType[]>([]);
  const [loading, setLoading] = useState(true); 
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveredRef = useRef(false);

  // Fetch images dynamically from DB
  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/getimage");
      const data = await res.json();
      if (data.success) {
        setImages(data.images);
      }
    } catch (err) {
      console.error("Error fetching images:", err);
    } finally {
      setLoading(false); //  Hide loader after fetch completes
    }
  };

  useEffect(() => {
    fetchImages();
  }, [refresh]);

  const startAutoSlide = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!isHoveredRef.current && images.length > 0) {
        setDirection(1);
        setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      }
    }, 3000);
  };

  const stopAutoSlide = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setDirection(1);
    setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (images.length > 0) {
      startAutoSlide();
    }
    return () => stopAutoSlide();
  }, [images.length]);

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
  };

  // Show only Zanfest loader while fetching
  if (loading) {
    return <Loader />;
  }

  //  No “Loading images…” text anymore — just skip to carousel
  if (images.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.carousel}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={current}
          className={styles.imageWrapper}
          custom={direction}
          initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction < 0 ? 300 : -300, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <img
            src={images[current].imageUrl}
            alt={images[current].title || `Slide ${current}`}
            className={styles.image}
          />
        </motion.div>
      </AnimatePresence>

      <button
        onClick={prevSlide}
        className={`${styles.navButton} ${styles.left}`}
      >
        ◀
      </button>
      <button
        onClick={nextSlide}
        className={`${styles.navButton} ${styles.right}`}
      >
        ▶
      </button>

      <div className={styles.indicators}>
        {images.map((_, idx) => (
          <button
            key={idx}
            className={`${styles.dot} ${
              idx === current ? styles.activeDot : ""
            }`}
            onClick={() => setCurrent(idx)}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;
