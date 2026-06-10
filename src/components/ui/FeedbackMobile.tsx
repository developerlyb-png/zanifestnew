import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "@/styles/components/ui/FeedbackMobile.module.css";

interface CarouselProps {
  items: React.ReactNode[];
}

const SingleIHtmlCarousal: React.FC<CarouselProps> = ({ items }) => {
  const [[current, direction], setCurrentSlide] = useState([0, 0]);

  const next = () => {
    setCurrentSlide(([prev, _]) => [(prev + 1) % items.length, 1]);
  };

  const prev = () => {
    setCurrentSlide(([prev, _]) => [(prev - 1 + items.length) % items.length, -1]);
  };

const variants = {
      enter: (dir: number) => ({
        x: dir > 0 ? window.innerWidth : -window.innerWidth,
        zIndex: 0,
      }),
      center: {
        x: 0,
        zIndex: 1,
      },
      exit: (dir: number) => ({
        x: dir > 0 ? -window.innerWidth : window.innerWidth,
        zIndex: 0,
      }),
    };

  return (
    <div className={styles.carousel}>
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current}
          className={styles.item}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
      transition={{ duration: 0.5, ease: [0.7, 0.6, 0.25, 0.5] }} // smooth slide
        >
          <div className={styles.carItem}>{items[current]}</div>
        </motion.div>
      </AnimatePresence>

      <button onClick={prev} className={`${styles.nav} ${styles.left}`}>
        ◀
      </button>
      <button onClick={next} className={`${styles.nav} ${styles.right}`}>
        ▶
      </button>

      {/* <div className={styles.dots}>
        {items.map((_, index) => (
          <button
            key={index}
            className={`${styles.dot} ${
              current === index ? styles.active : ""
            }`}
            onClick={() => setCurrent(index)}
          />
        ))}
      </div> */}
    </div>
  );
};

export default SingleIHtmlCarousal;
