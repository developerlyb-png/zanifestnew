"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import styles from "@/styles/components/superadminsidebar/reviewApplications.module.css";

import { FaEye } from "react-icons/fa";
import { FaDownload } from "react-icons/fa";
import { FaTimes } from "react-icons/fa";
import { FaCheck } from "react-icons/fa";
import { FaFilter } from "react-icons/fa";
import FilterPanel from "@/components/superadminsidebar/FilterPanel";

export default function ShowResult() {

const [resultUploaded, setResultUploaded] = useState(false);

const [agents, setAgents] = useState<any[]>([]);
const [showModal, setShowModal] = useState(false);
const [selectedAgent, setSelectedAgent] = useState<any>(null);

const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("all");

const [currentPage, setCurrentPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(10);

const [successMsg, setSuccessMsg] = useState("");

/* ---------------- ADVANCED FILTER STATES ---------------- */

const [showFilter, setShowFilter] = useState(false);

const [filters, setFilters] = useState([
  { field: "", condition: "is", value: "" },
]);

const [operator, setOperator] = useState<"AND" | "OR">("AND");

const updateFilter = (
  index: number,
  key: "field" | "condition" | "value",
  value: string
) => {
  const updated = [...filters];
  updated[index][key] = value;
  setFilters(updated);
};

const addFilter = () => {
  setFilters([...filters, { field: "", condition: "is", value: "" }]);
};

const removeFilter = (index: number) => {
  const updated = filters.filter((_, i) => i !== index);
  setFilters(updated);
};

const clearFilters = () => {
  setFilters([{ field: "", condition: "is", value: "" }]);
};

/* ---------------- LOAD AGENTS ---------------- */

const loadAgents = async () => {
  const res = await axios.get("/api/getallagents");
  setAgents(res.data || []);
};

useEffect(() => {
  loadAgents();
}, []);

/* ---------------- APPROVE ---------------- */

const approveAgent = async () => {

  const freshAgent = agents.find(a => a._id === selectedAgent._id);

  if (!freshAgent?.certificate2) {
    alert("Please generate or upload certificate first");
    return;
  }

  await axios.post("/api/updateStatus", {
    id: selectedAgent._id,
    status: "approved"
  });

  setSuccessMsg("Agent approved successfully ✅");
  loadAgents();
};

/* ---------------- FAIL ---------------- */

const failAgent = async (agent:any) => {

  if(!confirm("Are you sure you want to mark this agent as Failed?")) return;

  await axios.post("/api/updateStatus", {
    id: agent._id,
    status: "failed"
  });

  loadAgents();
};

/* ---------------- GENERATE PDF ---------------- */

const generatePDF = async () => {

  await axios.post("/api/createCertificate", {
    agentId: selectedAgent._id
  });

  await loadAgents();

  setSuccessMsg("Certificate generated successfully ✅");
};

/* ---------------- UPLOAD CERTIFICATE ---------------- */

const uploadCertificate = async (file: File) => {

  const formData = new FormData();

  formData.append("file", file);
  formData.append("agentId", selectedAgent._id);

  await axios.post("/api/uploadCertificate", formData);

  await loadAgents();

  setSuccessMsg("Certificate uploaded successfully ✅");
};

/* ---------------- DOWNLOAD ---------------- */

const downloadFile = (url: string) => {

  const link = document.createElement("a");

  link.href = `${window.location.origin}${url}`;
  link.download = "";

  link.click();
};

/* ---------------- FILTER ---------------- */

const filteredAgents = useMemo(() => {

  return agents

  .filter(a =>
    a.status === "reviewed" ||
    a.status === "approved" ||
    a.status === "failed"
  )

  .filter(a => {

    const matchesSearch =
      a.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      a.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      a.agentCode?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || a.status === statusFilter;

    return matchesSearch && matchesStatus;

  })

  .filter((a)=>{

    if(filters.length === 0) return true;

    const results = filters.map((f)=>{

      if(!f.field || !f.value) return true;

      const fieldValue = a[f.field]?.toString().toLowerCase();
      const value = f.value.toLowerCase();

      if(f.condition === "contains") return fieldValue?.includes(value);

      if(f.condition === "is") return fieldValue === value;

      return true;
    });

    return operator === "AND"
      ? results.every(Boolean)
      : results.some(Boolean);

  });

}, [agents, search, statusFilter, filters, operator]);

/* ---------------- PAGINATION ---------------- */

const totalPages = Math.ceil(filteredAgents.length / rowsPerPage);

const paginatedAgents = filteredAgents.slice(
  (currentPage - 1) * rowsPerPage,
  currentPage * rowsPerPage
);

const statusBadge = (status:string) => {

  if(status === "approved") return styles.badgeApproved;

  if(status === "reviewed") return styles.badgeReviewed;

  if(status === "failed") return styles.badgeFailed;

  return styles.badgePending;
};

return (
<div className={styles.pageWrapper}>

<h2 className={styles.title}>POS Certificate</h2>

{/* FILTER BAR */}

<div className={styles.filterBar}>

<div style={{ position:"relative" }}>

<button
  className={styles.filterBtn}
  onClick={() => setShowFilter(!showFilter)}
>
  <FaFilter style={{ marginRight: 6 }} />
  Filter
</button>

</div>

<FilterPanel
showFilter={showFilter}
setShowFilter={setShowFilter}
filters={filters}
operator={operator}
updateFilter={updateFilter}
addFilter={addFilter}
removeFilter={removeFilter}
clearFilters={clearFilters}
setOperator={setOperator}
/>

{/* <input
placeholder="Search agent..."
className={styles.searchInput}
value={search}
onChange={(e)=>{
setSearch(e.target.value);
setCurrentPage(1);
}}
/> */}

{/* <select
className={styles.select}
value={statusFilter}
onChange={(e)=>{
setStatusFilter(e.target.value);
setCurrentPage(1);
}}
>
<option value="all">Select Status</option>
<option value="reviewed">Reviewed</option>
<option value="approved">Approved</option>
<option value="failed">Failed</option>
</select> */}

{/* <select
className={styles.select}
value={rowsPerPage}
onChange={(e)=>{
setRowsPerPage(Number(e.target.value));
setCurrentPage(1);
}}
>
<option value={5}>5</option>
<option value={10}>10</option>
<option value={20}>20</option>
</select> */}

</div>

{/* TABLE */}

<table className={styles.table}>
<thead>

<tr>
<th>Date</th>
<th>Agent Code</th>
<th>Name</th>
<th>Email</th>
<th>Status</th>
<th>Result</th>
<th>Certificate</th>
<th>Pass /Fail</th>
</tr>

</thead>

<tbody>

{paginatedAgents.map((agent) => (

<tr key={agent._id} className={styles.tableRow}>

<td>
{agent.createdAt
? new Date(agent.createdAt).toLocaleDateString("en-IN")
: "-"}
</td>

<td>{agent.agentCode || "-"}</td>

<td>{agent.firstName} {agent.lastName}</td>

<td>{agent.email}</td>

<td>
<span className={`${styles.statusBadge} ${statusBadge(agent.status)}`}>
{agent.status}
</span>
</td>

<td>

{agent.certificate1 ? (

<>
<button
className={styles.reviewBtn}
onClick={()=>window.open(agent.certificate1,"_blank")}
>
<FaEye/>
</button>

<button
className={styles.reviewBtn}
style={{marginLeft:5}}
onClick={()=>downloadFile(agent.certificate1)}
>
<FaDownload/>
</button>
</>

) : "—"}

</td>

<td>

{agent.certificate2 ? (

<>
<button
className={styles.reviewBtn}
onClick={()=>window.open(agent.certificate2,"_blank")}
>
<FaEye/>
</button>

<button
className={styles.reviewBtn}
style={{marginLeft:5}}
onClick={()=>downloadFile(agent.certificate2)}
>
<FaDownload/>
</button>
</>

) : "—"}

</td>

<td>

{agent.status === "reviewed" && (

<>

<button
className={styles.reviewBtn}
style={{ background:"transparent", border:"none" }}
onClick={()=>{

setSelectedAgent(agent);
setSuccessMsg("");
setShowModal(true);

}}
>
<FaCheck style={{ color:"#21cc5a", fontSize:18 }}/>
</button>

<button
className={styles.reviewBtn}
style={{ background:"transparent", border:"none", marginLeft:5 }}
onClick={()=>failAgent(agent)}
>
<FaTimes style={{ color:"#ef4444", fontSize:18 }}/>
</button>

</>

)}

</td>

</tr>

))}

</tbody>
</table>

</div>
);
}