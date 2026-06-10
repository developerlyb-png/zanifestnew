"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import AllInsuranceSection from "@/components/home/AllInsuranceSection";
import styles from "@/styles/components/superadminsidebar/AllInsuranceCAdmin.module.css";

const AllInsuranceCAdmin = () => {
  const [heading, setHeading] = useState("");
  const [serviceForms, setServiceForms] = useState<any[]>([]);

  useEffect(() => {
    axios.get("/api/allinsuranceapi").then((res) => {
      setHeading(res.data.heading || "");
      setServiceForms(res.data.services || []);
    });
  }, []);

  const handleHeadingSave = async () => {
    try {
      await axios.post("/api/allinsuranceapi", { heading });
      alert("Heading updated!");
    } catch (err) {
      console.error(err);
      alert("Failed to update heading.");
    }
  };

  const handleFormChange = (index: number, field: string, value: string) => {
    const updatedForms = [...serviceForms];
    updatedForms[index][field] = value;
    setServiceForms(updatedForms);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const updatedForms = [...serviceForms];
      updatedForms[index].image = reader.result as string;
      setServiceForms(updatedForms);
    };
    reader.readAsDataURL(file);
  };

  const handleServiceSave = async (index: number) => {
    try {
      await axios.post("/api/allinsuranceapi", {
        serviceIndex: index,
        ...serviceForms[index],
      });
      alert(`Service ${index + 1} updated!`);
    } catch (err) {
      console.error(err);
      alert(`Failed to update service ${index + 1}.`);
    }
  };

  return (
    <>
      {/* Live Preview */}
      <div className={styles.previewBox}>
        <h3 className={styles.previewTitle}>Live Preview</h3>
        <AllInsuranceSection
          previewHeading={heading}
          previewServices={serviceForms}
        />
      </div>

      <div className={styles.container}>
        <h2 className={styles.pageTitle}>Edit All Insurance Section</h2>

        {/* Heading Box */}
        <div className={styles.headingBox}>
          <h3>Heading:</h3>
          <input
            type="text"
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            className={styles.headingInput}
          />
          <button onClick={handleHeadingSave} className={styles.headingBtn}>
            Update Heading
          </button>
        </div>

        {/* Services Grid */}
        <div className={styles.servicesGrid}>
          {serviceForms.map((service, index) => (
            <div key={index} className={styles.serviceCard}>
              <h4>Item {index + 1}</h4>

              <input
                type="text"
                value={service.name}
                onChange={(e) => handleFormChange(index, "name", e.target.value)}
                className={styles.input}
                placeholder="Service Name"
              />

              <textarea
                value={service.desc}
                onChange={(e) => handleFormChange(index, "desc", e.target.value)}
                className={styles.textarea}
                placeholder="Service Description"
              />

              <input
                type="file"
                onChange={(e) => handleImageChange(e, index)}
                className={styles.fileInput}
              />
              {service.image && (
                <img
                  src={service.image}
                  alt="preview"
                  className={styles.imagePreview}
                />
              )}

              <input
                type="text"
                value={service.link}
                onChange={(e) => handleFormChange(index, "link", e.target.value)}
                className={styles.input}
                placeholder="Service Link"
              />

              <button
                onClick={() => handleServiceSave(index)}
                className={styles.updateBtn}
              >
                Update Item {index + 1}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default AllInsuranceCAdmin;
