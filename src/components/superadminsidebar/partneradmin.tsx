"use client";

import React, { useState, useEffect } from "react";
import Image, { StaticImageData } from "next/image";
import useSWR, { mutate } from "swr";
import Partners from "../home/Partners";
import img1 from "@/assets/home/car/1.png";
import img2 from "@/assets/home/car/2.png";
import img3 from "@/assets/home/car/6.png";
import styles from "@/styles/components/superadminsidebar/partneradmin.module.css";

// ---------------- TYPES ----------------
interface Category {
  name: string;
  icon: StaticImageData;
}

interface PartnerCategory {
  category: string;
  heading: string;
  images: string[];
}

interface PartnersApiResponse {
  categories: PartnerCategory[];
}

// ---------------- CONSTANTS ----------------
const CATEGORYLIST: Category[] = [
  { name: "Health Insurance", icon: img1 },
  { name: "Motor Insurance", icon: img2 },
  { name: "Fire Insurance", icon: img3 },
];

const fetcher = (url: string) => fetch(url).then(res => res.json());

// ---------------- COMPONENT ----------------
const PartnerAdmin: React.FC = () => {
  const { data } = useSWR<PartnersApiResponse>("/api/partnersApi", fetcher);

  const [selectedCategory, setSelectedCategory] = useState<Category>(CATEGORYLIST[0]);
  const [headingMap, setHeadingMap] = useState<{ [key: string]: string }>({});
  const [imagesMap, setImagesMap] = useState<{ [key: string]: string[] }>({});

  // -------- Populate from DB --------
  useEffect(() => {
    if (!data) return;

    const hMap: any = {};
    const iMap: any = {};

    data.categories.forEach(c => {
      hMap[c.category] = c.heading || "";
      iMap[c.category] = c.images || [];
    });

    setHeadingMap(hMap);
    setImagesMap(iMap);
  }, [data]);
const validateSquareImage = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new window.Image(); // ✅ native image
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const isSquare = img.naturalWidth === img.naturalHeight;
      URL.revokeObjectURL(img.src);
      resolve(isSquare);
    };
  });
};

  // -------- Image Upload --------
 const handleImageUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  if (!e.target.files || !selectedCategory) return;

  const file = e.target.files[0];

  // 🔥 1:1 RATIO CHECK
  const isValid = await validateSquareImage(file);

  if (!isValid) {
    alert("❌ Image must be in 1:1 (square) ratio");
    e.target.value = ""; // reset input
    return;
  }

  const reader = new FileReader();

  reader.onloadend = () => {
    setImagesMap(prev => ({
      ...prev,
      [selectedCategory.name]: [
        ...(prev[selectedCategory.name] || []),
        reader.result as string,
      ],
    }));
  };

  reader.readAsDataURL(file);
};


  // -------- Delete Image --------
  const handleDeleteImage = (index: number) => {
    if (!selectedCategory) return;

    setImagesMap(prev => ({
      ...prev,
      [selectedCategory.name]: prev[selectedCategory.name].filter(
        (_, i) => i !== index
      ),
    }));
  };

  // -------- Save All --------
  const handleSaveAll = async () => {
    const body = {
      categories: CATEGORYLIST.map(cat => ({
        category: cat.name,
        heading: headingMap[cat.name] || "",
        images: imagesMap[cat.name] || [],
      })),
    };

    await fetch("/api/partnersApi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // 🔥 Force frontend refresh
    await mutate("/api/partnersApi", undefined, { revalidate: true });

    alert("Saved successfully!");
  };

  // ---------------- UI ----------------
  return (
    <div className={styles.container}>
      {/* Category Selector */}
      <div className={styles.categoryList}>
        {CATEGORYLIST.map(cat => (
          <div
            key={cat.name}
            className={`${styles.categoryItem} ${
              selectedCategory.name === cat.name ? styles.active : ""
            }`}
            onClick={() => setSelectedCategory(cat)}
          >
            <Image src={cat.icon} alt={cat.name} width={40} height={40} />
            <span>{cat.name}</span>
          </div>
        ))}
      </div>

      {/* Editor */}
      <div className={styles.editor}>
        {/* Heading */}
        <div className={styles.card}>
          <h4>Heading</h4>
          <input
            value={headingMap[selectedCategory.name] || ""}
            onChange={(e) =>
              setHeadingMap(prev => ({
                ...prev,
                [selectedCategory.name]: e.target.value,
              }))
            }
          />
        </div>

        {/* Image Upload */}
        <div className={styles.card}>
          <h4>Partner Logos</h4>

          <div className={styles.imagesGrid}>
            {(imagesMap[selectedCategory.name] || []).map((img, idx) => (
              <div key={idx} className={styles.imageWrapper}>
                <Image src={img} alt="" width={100} height={100} />
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDeleteImage(idx)}
                >
                  ✕
                </button>
              </div>
            ))}

            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleImageUpload}
            />
          </div>
        </div>

        {/* Save */}
        <button className={styles.saveBtn} onClick={handleSaveAll}>
          Save All
        </button>

        {/* Live Preview */}
        <div className={styles.card}>
          <h4>Live Preview</h4>
          <Partners
            liveHeading={headingMap[selectedCategory.name]}
            liveImages={imagesMap[selectedCategory.name] || []}
          />
        </div>
      </div>
    </div>
  );
};

export default PartnerAdmin;
