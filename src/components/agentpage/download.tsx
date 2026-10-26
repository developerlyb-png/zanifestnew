"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { FiAward, FiDownload } from "react-icons/fi";
import styles from "@/styles/pages/agent.module.css";

export default function DownloadCertificate() {

  const [data,setData] = useState<any>(null);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{

    axios.get("/api/agent/certificate",{ withCredentials:true })
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(()=> setLoading(false));

  },[]);

  if(loading){
    return (
      <div className={styles.certificatePage}>
        <p className={styles.certificateState}>Loading certificate...</p>
      </div>
    );
  }

  if(!data?.success){
    return (
      <div className={styles.certificatePage}>
        <div className={styles.certificateEmpty}>
          <span className={styles.certificateIcon}><FiAward /></span>
          <h2>Certificate unavailable</h2>
          <p>{data?.message || "Your certificate is not available yet."}</p>
        </div>
      </div>
    );
  }

  // New certificates are stored as base64 data URIs (survive redeploys,
  // unlike a file path under public/certificates) — used as-is. Older
  // agents may still have the legacy "/certificates/xxx.pdf" relative path
  // from before that change, which still needs the origin prefixed.
  const raw: string = data.certificate;
  const fileUrl = raw.startsWith("data:") || raw.startsWith("http")
    ? raw
    : `${window.location.origin}${raw}`;

  const downloadFile = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `${data.agentCode || "certificate"}.pdf`;
    link.click();
  };

  return (
    <div className={styles.certificatePage}>
      <div className={styles.certificateHeading}>
        <span>AGENT RESOURCES</span>
        <h2>My Certificate</h2>
        <p>Your official agent certificate is ready to download.</p>
      </div>

      <section className={styles.certificateCard}>
        <div className={styles.certificateCardHeading}>
          <span className={styles.certificateIcon}><FiAward /></span>
          <div>
            <h3>Agent Certificate</h3>
            <p>Verified Zanifest agent document</p>
          </div>
        </div>

        <div className={styles.certificateDetails}>
          <div className={styles.certificateDetail}>
            <span>Name</span>
            <strong>{data.agentName || "—"}</strong>
          </div>
          <div className={styles.certificateDetail}>
            <span>Agent Code</span>
            <strong>{data.agentCode || "—"}</strong>
          </div>
        </div>

        <button className={styles.downloadBtn} onClick={downloadFile}>
          <FiDownload aria-hidden="true" />
          Download Certificate
        </button>
      </section>
    </div>
  );
}
