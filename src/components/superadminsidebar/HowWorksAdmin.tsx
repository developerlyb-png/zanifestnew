// /components/HowWorksAdmin.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import useSWR, { mutate } from "swr";
import Image from "next/image";
import HowWorksSections from "../home/HowWorksSections";
import styles from "@/styles/components/superadminsidebar/howworksadmin.module.css";

const fetcher = (url: string) => axios.get(url).then(res => res.data.data);

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

export default function HowWorksAdmin() {
  const { data, error } = useSWR("/api/howworksapi?includeImages=true", fetcher);

  const [mainHeading, setMainHeading] = useState("");
  const [servicesHeading, setServicesHeading] = useState("");
  const [steps, setSteps] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const initialized = useRef(false);

  useEffect(() => {
    if (data && !initialized.current) {
      setMainHeading(data.mainHeading || "");
      setServicesHeading(data.servicesHeading || "");
      setSteps(data.steps || []);
      setServices(data.services || []);
      initialized.current = true;
    }
  }, [data]);

  const handleSave = async (payload: any, successMessage: string) => {
    try {
      await axios.post("/api/howworksapi", payload);
      mutate("/api/howworksapi");
      alert(successMessage);
    } catch (err) {
      console.error("Failed to save", err);
      alert("Error saving data");
    }
  };

  const handleStepChange = (index: number, field: string, value: string) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  const handleStepImageChange = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64Image = await fileToBase64(file);
      handleStepChange(index, "image", base64Image);
    }
  };

  const handleStepUpdate = async (index: number) => {
    await handleSave({ steps }, `Step ${index + 1} updated successfully!`);
  };

  const handleServiceChange = (index: number, field: string, value: string) => {
    const newServices = [...services];
    newServices[index][field] = value;
    setServices(newServices);
  };

  const handleServiceImageChange = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64Image = await fileToBase64(file);
      handleServiceChange(index, "image", base64Image);
    }
  };

  const handleServiceUpdate = async (index: number) => {
    await handleSave({ services }, `Service ${index + 1} updated successfully!`);
  };

  if (error) return <p>Failed to load data</p>;
  if (!data) return <p>Loading...</p>;

  return (
    <>
     {/* Live Preview */}
      <div className={styles.livePreview}>
        <h2>Live Preview</h2>
        <HowWorksSections />
      </div>
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Edit Section</h1>

      {/* Section Headings */}
      <div className={styles.headingBox}>
        <h3>How We Work? Heading:</h3>
        <input
          type="text"
          className={styles.headingInput}
          value={mainHeading}
          onChange={(e) => setMainHeading(e.target.value)}
        />
        <h3 style={{ marginTop: "12px" }}>Pay Less Cover More Heading:</h3>
        <input
          type="text"
          className={styles.headingInput}
          value={servicesHeading}
          onChange={(e) => setServicesHeading(e.target.value)}
        />
        <button
          onClick={() =>
            handleSave({ mainHeading, servicesHeading }, "Headings updated successfully!")
          }
        >
          Update Headings
        </button>
      </div>

      {/* Steps */}
      <h2 className={styles.pageTitle}>How We Work?</h2>
      <div className={styles.cardsGrid}>
        {steps.map((step, index) => (
          <div key={index} className={styles.card}>
            <h4>Step {index + 1}</h4>
            <label>Name:</label>
            <input
              type="text"
              value={step.name}
              onChange={(e) => handleStepChange(index, "name", e.target.value)}
            />
            <label>Description:</label>
            <textarea
              value={step.desc}
              onChange={(e) => handleStepChange(index, "desc", e.target.value)}
            />
            <label>Image</label>
            <input
               type="file"
  accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => handleStepImageChange(index, e)}
            />
            {step.image && (
             <img
  src={step.image}
  alt="Preview"
  width={100}
  height={100}
  className={styles.imagePreview}
  style={{ objectFit: "contain" }}
/>
            )}
            <button onClick={() => handleStepUpdate(index)}>
              Update Step {index + 1}
            </button>
          </div>
        ))}
      </div>

      {/* Services */}
      <h2 className={styles.pageTitle}>Pay Less Cover More</h2>
      <div className={styles.cardsGrid}>
        {services.map((service, index) => (
          <div key={index} className={styles.card}>
            <h4>Service {index + 1}</h4>
            <label>Name:</label>
            <input
              type="text"
              value={service.name}
              onChange={(e) => handleServiceChange(index, "name", e.target.value)}
            />
            <label>Description:</label>
            <input
              type="text"
              value={service.desc}
              onChange={(e) => handleServiceChange(index, "desc", e.target.value)}
            />
            <label>Image</label>
            <input
               type="file"
  accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => handleServiceImageChange(index, e)}
            />
            {service.image && (
           <img
  src={service.image}
  alt="Preview"
  width={100}
  height={100}
  className={styles.imagePreview}
  style={{ objectFit: "contain" }}
/>

            )}
            <button onClick={() => handleServiceUpdate(index)}>
              Update Service {index + 1}
            </button>
          </div>
        ))}
      </div>

     
    </div>
    </>
  );
}