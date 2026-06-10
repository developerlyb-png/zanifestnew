"use client";
import React, { useEffect, useState } from "react";
import Carousel from "@/components/ui/Carousal";
import styles from "@/styles/pages/Homesection.module.css";

interface ImageType {
  _id: string;
  title: string;
  imageUrl: string;
}

const HomeSection = () => {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [images, setImages] = useState<ImageType[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // convert to base64
  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  // validate aspect ratio
  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const ratio = img.width / img.height;
        if (ratio > 20 / 7) {
          alert("❌ Invalid Image. Aspect ratio cannot exceed 16:9");
          resolve(false);
        } else resolve(true);
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const valid = await validateImage(f);
      if (!valid) return;
      setFile(f);
      const base64 = await toBase64(f);
      setPreview(base64);
    }
  };

  const fetchImages = async () => {
    const res = await fetch("/api/getimage");
    const data = await res.json();
    if (data.success) setImages(data.images);
  };

  useEffect(() => {
    fetchImages();
  }, [refreshKey]);

  const handleSubmit = async () => {
if (!title || (!preview && !editId)) {
  return alert("Please fill all fields");
}

    if (!editId && images.length >= 10) {
      return alert("❌ You can only upload up to 10 images");
    }

    const endpoint = editId
      ? `/api/updateimage?id=${editId}`
      : "/api/uploadimage";
    const method = editId ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, imageUrl: preview }),
    });

    const data = await res.json();
    if (data.success) {
      setToast(editId ? "✅ Image updated!" : "✅ Image uploaded!");
      setTitle("");
      setFile(null);
      setPreview(null);
      setEditId(null);
      setRefreshKey((prev) => prev + 1);
      setTimeout(() => setToast(null), 3000);
    } else {
      alert("Failed: " + data.error);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/deleteimage?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setToast("🗑 Image deleted!");
      setRefreshKey((prev) => prev + 1);
      setTimeout(() => setToast(null), 3000);
    } else {
      alert("Delete failed: " + data.error);
    }
  };

  return (
    <div className={styles.container}>
      {toast && <div className={styles.toast}>{toast}</div>}

      {/* 1️⃣ Upload Form Section */}
      <div className={styles.formSection}>
        <h2 className={styles.heading}>
          {editId ? "Update Carousel Image" : "Upload Carousel Image"}
        </h2>
        <input
          type="text"
          placeholder="Image Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={styles.input}
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={styles.input}
        />
        <button onClick={handleSubmit} className={styles.btnOrange}>
          {editId ? "Update" : "Upload"}
        </button>
      </div>

      {/* 2️⃣ Carousel Section */}
      <div className={styles.carouselSection}>
        <h3 className={styles.subHeading}>Carousel Preview</h3>
        <div className={styles.carouselWrapper}>
          <Carousel refresh={refreshKey} />
        </div>
      </div>

      {/* 3️⃣ Uploaded Images Section */}
      <div className={styles.uploadedSection}>
        <h3 className={styles.subHeading}>Uploaded Images</h3>
        <div className={styles.imageGrid}>
          {images.map((img) => (
            <div key={img._id} className={styles.card}>
              <img
                src={img.imageUrl}
                alt={img.title}
                className={styles.cardImage}
              />
              <p className={styles.cardTitle}>{img.title}</p>
              <div className={styles.cardActions}>
              {/* <button
  onClick={() => {
    setEditId(img._id);
    setTitle(img.title);
    setPreview(img.imageUrl); // important
    setFile(null);            // reset file input
  }}
  className={styles.btnEdit}
>
  Edit
</button> */}

                <button
                  onClick={() => handleDelete(img._id)}
                  className={styles.btnDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeSection;

