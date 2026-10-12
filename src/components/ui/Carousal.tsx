
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

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isHoveredRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const fetchImages = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/getimage");

        if (!res.ok) {
          throw new Error("Failed to fetch carousel images");
        }

        const data = await res.json();

        if (isMounted && data.success) {
          setImages(data.images || []);
          setCurrent(0);
        }
      } catch (error) {
        console.error("Error fetching images:", error);

        if (isMounted) {
          setImages([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchImages();

    return () => {
      isMounted = false;
    };
  }, [refresh]);

  const stopAutoSlide = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    stopAutoSlide();

    if (images.length > 1) {
      intervalRef.current = setInterval(() => {
        if (!isHoveredRef.current) {
          setDirection(1);

          setCurrent((prev) =>
            prev >= images.length - 1 ? 0 : prev + 1
          );
        }
      }, 3000);
    }

    return () => {
      stopAutoSlide();
    };
  }, [images.length]);

  const prevSlide = () => {
    if (images.length < 2) return;

    setDirection(-1);

    setCurrent((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const nextSlide = () => {
    if (images.length < 2) return;

    setDirection(1);

    setCurrent((prev) =>
      prev >= images.length - 1 ? 0 : prev + 1
    );
  };

  if (loading) {
    return <Loader />;
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.carousel}
      onMouseEnter={() => {
        isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
      }}
    >
      <AnimatePresence
        initial={false}
        custom={direction}
        mode="popLayout"
      >
        <motion.div
          key={images[current]._id || current}
          className={styles.imageWrapper}
          custom={direction}
          initial={{
            x: direction > 0 ? 300 : direction < 0 ? -300 : 0,
            opacity: direction === 0 ? 1 : 0,
          }}
          animate={{
            x: 0,
            opacity: 1,
          }}
          exit={{
            x: direction < 0 ? 300 : -300,
            opacity: 0,
          }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
          }}
        >
          <img
            src={images[current].imageUrl}
            alt={images[current].title || `Slide ${current + 1}`}
            className={styles.image}
          />
        </motion.div>
      </AnimatePresence>

      {images.length > 1 && (
        <div className={styles.indicators}>
          {images.map((item, index) => (
            <button
              key={item._id || index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={
                index === current ? "true" : undefined
              }
              className={`${styles.dot} ${
                index === current ? styles.activeDot : ""
              }`}
              onClick={() => {
                setDirection(index > current ? 1 : -1);
                setCurrent(index);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;
