"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import useSWR, { mutate } from "swr";
import DemoSection from "../home/DemoSection";
import styles from "@/styles/components/superadminsidebar/DemoAdmin.module.css";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const DEFAULT_ITEMS = [
  { name: "Over 9 Million", desc: "", image: "", color: "#e7f9f7" },
  { name: "50+ Insurers", desc: "", image: "", color: "#ebf2f8" },
  { name: "Great Price", desc: "", image: "", color: "#f9e5e2" },
  { name: "Claims", desc: "", image: "", color: "#faf6e2" },
];

const useItemForm = (itemIndex: number, data: any) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState("");
  const [color, setColor] = useState("");

  useEffect(() => {
    const item = data?.items?.[itemIndex];
    if (item) {
      setName(item.name || "");
      setDesc(item.desc || "");
      setImage(item.image || "");
      setColor(item.color || "");
    }
  }, [data, itemIndex]);

  const saveItem = async () => {
    try {
      await axios.post("/api/demoapi", { itemId: itemIndex, name, desc, image, color });
      alert("Item updated successfully!");
      mutate(
        "/api/demoapi",
        (currentData: any) => {
          if (!currentData) return;
          const updatedItems = [...(currentData.items || DEFAULT_ITEMS)];
          updatedItems[itemIndex] = { ...updatedItems[itemIndex], name, desc, image, color };
          return { ...currentData, items: updatedItems };
        },
        false
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update item");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return { name, desc, image, color, setName, setDesc, setColor, handleImageChange, saveItem };
};

export default function DemoAdmin() {
  const { data } = useSWR("/api/demoapi", fetcher, {
    fallbackData: {
      heading: "Why is ZANIFEST India’s go-to for insurance?",
      subheading:
        "Zanifest is your trusted partner in insurance — providing transparent comparisons, affordable policies, and dedicated support.",
      items: DEFAULT_ITEMS,
    },
  });

  const [heading, setHeading] = useState(data?.heading || "");
  const [subheading, setSubheading] = useState(data?.subheading || "");

  useEffect(() => {
    if (data) {
      setHeading(data.heading || "");
      setSubheading(data.subheading || "");
    }
  }, [data]);

  const itemForms = DEFAULT_ITEMS.map((_, index) => useItemForm(index, data));

  const saveHeading = async () => {
    try {
      await axios.post("/api/demoapi", { heading });
      alert("Heading updated successfully!");
      mutate("/api/demoapi", { ...data, heading }, false);
    } catch (err) {
      console.error(err);
      alert("Failed to update heading");
    }
  };

  const saveSubheading = async () => {
    try {
      await axios.post("/api/demoapi", { subheading });
      alert("Subheading updated successfully!");
      mutate("/api/demoapi", { ...data, subheading }, false);
    } catch (err) {
      console.error(err);
      alert("Failed to update subheading");
    }
  };

  if (!data) return <div>Loading admin panel...</div>;

  return (
    <>
      {/* Live Preview */}
      <div className={styles.previewSection}>
        <h2>Live Preview</h2>
        <DemoSection />
      </div>

      <div className={styles.container}>
        <h1>Demo Edit Section</h1>

        {/* Heading & Subheading */}
        <div className={styles.headingSubheadingRow}>
          <div className={styles.headingSection}>
            <label className={styles.label}>Heading:</label>
            <input
              type="text"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              className={styles.input}
            />
            <button onClick={saveHeading} className={`${styles.button} ${styles.saveHeadingBtn}`}>
              Save Heading
            </button>
          </div>

          <div className={styles.subheadingSection}>
            <label className={styles.label}>Subheading:</label>
            <textarea
              value={subheading}
              onChange={(e) => setSubheading(e.target.value)}
              className={styles.textarea}
            />
            <button
              onClick={saveSubheading}
              className={`${styles.button} ${styles.saveSubheadingBtn}`}
            >
              Save Subheading
            </button>
          </div>
        </div>

        {/* Items Grid */}
        <div className={styles.itemGrid}>
          {itemForms.map((itemForm, index) => (
            <div key={index} className={styles.itemCard}>
              <div className={styles.itemCardContent}>
                <h3>Item {index + 1}</h3>

                <label className={styles.label}>Name:</label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => itemForm.setName(e.target.value)}
                  className={styles.input}
                />

                <label className={styles.label}>Description:</label>
                <textarea
                  value={itemForm.desc}
                  onChange={(e) => itemForm.setDesc(e.target.value)}
                  className={styles.textarea}
                />

                <label className={styles.label}>Image:</label>
                <input
                  type="file"
                  onChange={itemForm.handleImageChange}
                  className={styles.fileInput}
                />

                {/* Preview below file input */}
                {itemForm.image && (
                  <img
                    src={itemForm.image}
                    alt={`preview ${index + 1}`}
                    className={styles.previewImage}
                  />
                )}

                <label className={styles.label}>Background Color:</label>
                <input
                  type="text"
                  value={itemForm.color}
                  onChange={(e) => itemForm.setColor(e.target.value)}
                  className={styles.colorInput}
                />

                <button
                  onClick={itemForm.saveItem}
                  className={`${styles.button} ${styles.saveItemBtn}`}
                >
                  Update Item {index + 1}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
