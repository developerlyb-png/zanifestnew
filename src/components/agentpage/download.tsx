"use client";

import { useEffect, useState } from "react";
import axios from "axios";

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
    return <p style={{padding:20}}>Loading certificate...</p>;
  }

  if(!data?.success){
    return (
      <div style={{padding:20}}>
        <h3>{data?.message || "Certificate not available"}</h3>
      </div>
    );
  }

  const fileUrl = `${window.location.origin}${data.certificate}`;

  const downloadFile = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = "";
    link.click();
  };

  return (
    <div style={{ padding:20 }}>
      <h2>My Certificate</h2>

      <div style={{
        background:"#fff",
        padding:20,
        borderRadius:10,
        boxShadow:"0 4px 16px rgba(0,0,0,0.08)",
        maxWidth:520
      }}>

        <p><strong>Name:</strong> {data.agentName}</p>
        <p><strong>Agent Code:</strong> {data.agentCode}</p>

        <div style={{ display:"flex", gap:10, marginTop:12 }}>

          <button
            style={{ padding:"8px 12px", background:"#2563eb", color:"#fff", borderRadius:6 }}
            onClick={()=> window.open(fileUrl,"_blank")}
          >
            View Certificate
          </button>

          <button
            style={{ padding:"8px 12px", background:"#10b981", color:"#fff", borderRadius:6 }}
            onClick={downloadFile}
          >
            Download Certificate
          </button>

        </div>

      </div>
    </div>
  );
}
