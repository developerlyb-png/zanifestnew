"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FiArrowLeft,
  FiEdit2,
  FiFile,
  FiMail,
  FiMapPin,
  FiPhone,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import cs from "@/styles/components/superadminsidebar/Claims.module.css";
import cm from "@/styles/components/superadminsidebar/ClientManagement.module.css";

interface ClientRow {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  kycDocumentType?: string;
  kycFiles?: { data: string; fileName: string }[];
  notifyWhatsapp?: boolean;
  notifyEmail?: boolean;
  isGlobal?: boolean;
  isActive?: boolean;
  subClients?: { name: string; phone: string; email: string }[];
}

export default function ClientDetailView({
  clientId,
  onBack,
  onEdit,
}: {
  clientId: string;
  onBack: () => void;
  onEdit: () => void;
}) {
  const [client, setClient] = useState<ClientRow | null>(null);
  const [loading, setLoading] = useState(true);
  const isVirtual = clientId.startsWith("policy-");

  useEffect(() => {
    if (isVirtual) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/admin/clients?id=${clientId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setClient(d.success ? d.client : null))
      .catch(() => setClient(null))
      .finally(() => setLoading(false));
  }, [clientId, isVirtual]);

  if (loading) {
    return (
      <div className={cs.dWrap}>
        <button className={cs.dBack} onClick={onBack}>
          <FiArrowLeft /> Back to clients
        </button>
        <p className={cs.dLoading}>Loading client...</p>
      </div>
    );
  }

  if (isVirtual || !client) {
    return (
      <div className={cs.dWrap}>
        <button className={cs.dBack} onClick={onBack}>
          <FiArrowLeft /> Back to clients
        </button>
        <p style={{ color: "#6b7280", fontSize: 13.5 }}>
          {isVirtual
            ? "This insured name came from a policy and hasn't been saved to the client directory yet. Use Add Client to save it."
            : "Client not found."}
        </p>
      </div>
    );
  }

  return (
    <div className={cs.dWrap}>
      <button className={cs.dBack} onClick={onBack}>
        <FiArrowLeft /> Back to clients
      </button>

      <div className={cs.dHeader}>
        <div className={cs.dHeaderLeft}>
          <span className={cs.dFileIcon}>
            <FiUser />
          </span>
          <div>
            <div className={cs.dClaimNo}>{client.name}</div>
            <div className={cs.dHeaderSub}>
              <FiMail size={12} /> {client.email || "—"}
              <span>·</span>
              <FiPhone size={12} /> {client.phone || "—"}
            </div>
          </div>
        </div>
        <div className={cs.dHeaderActions}>
          <span className={`${cm.pill} ${client.isGlobal ? cm.pillGlobal : cm.pillPrivate}`}>
            {client.isGlobal ? "Global" : "Private"}
          </span>
          <button type="button" className={cs.dEditBtn} onClick={onEdit}>
            <FiEdit2 /> Edit
          </button>
        </div>
      </div>

      <div className={cs.dCols}>
        <div className={cs.dMain}>
          <div className={cs.dCard}>
            <div className={cs.dCardBody} style={{ borderTop: "none" }}>
              <div className={cs.dGrid}>
                <div className={cs.dRow}>
                  <span className={cs.dKey}>Client Name</span>
                  <span className={cs.dVal}>{client.name}</span>
                </div>
                <div className={cs.dRow}>
                  <span className={cs.dKey}>Email</span>
                  <span className={cs.dVal}>{client.email || "—"}</span>
                </div>
                <div className={cs.dRow}>
                  <span className={cs.dKey}>Phone</span>
                  <span className={cs.dVal}>{client.phone || "—"}</span>
                </div>
                <div className={cs.dRow}>
                  <span className={cs.dKey}>KYC Document Type</span>
                  <span className={cs.dVal}>{client.kycDocumentType || "—"}</span>
                </div>
                <div className={cs.dRow} style={{ gridColumn: "1 / -1" }}>
                  <span className={cs.dKey}>
                    <FiMapPin size={11} style={{ verticalAlign: -1, marginRight: 3 }} />
                    Address
                  </span>
                  <span className={cs.dVal}>{client.address || "—"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={cs.dCard}>
            <div
              className={cs.dCardHead}
              style={{ cursor: "default", pointerEvents: "none" }}
            >
              <FiFile /> KYC Documents
            </div>
            <div className={cs.dCardBody}>
              {!client.kycFiles || client.kycFiles.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: 13 }}>No KYC files uploaded.</p>
              ) : (
                <div className={cm.docGrid}>
                  {client.kycFiles.map((f, i) => (
                    <a key={i} href={f.data} download={f.fileName} className={cm.docRow} style={{ textDecoration: "none" }}>
                      <span className={cm.docTile}>
                        <FiFile size={15} />
                      </span>
                      <span className={cm.docName}>{f.fileName}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={cs.dCard}>
            <div className={cs.dCardHead} style={{ cursor: "default", pointerEvents: "none" }}>
              <FiUsers /> Sub-Clients
            </div>
            <div className={cs.dCardBody}>
              {!client.subClients || client.subClients.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: 13 }}>No sub-clients added yet.</p>
              ) : (
                client.subClients.map((sc, i) => (
                  <div key={i} className={cm.subClientCard}>
                    <span className={cm.subClientName}>{sc.name || "—"}</span>
                    <span className={cm.subClientMeta}>
                      {sc.phone || "—"} · {sc.email || "—"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className={cs.dSide}>
          <div className={cs.dCard}>
            <div className={cs.dCardHead} style={{ cursor: "default", pointerEvents: "none" }}>
              Status
            </div>
            <div className={cs.dCardBody}>
              <span className={`${cs.statusPill}`} style={client.isActive !== false ? { background: "#dcfce7", color: "#15803d" } : { background: "#fee2e2", color: "#b91c1c" }}>
                {client.isActive !== false ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className={cs.dCard}>
            <div className={cs.dCardHead} style={{ cursor: "default", pointerEvents: "none" }}>
              Notifications
            </div>
            <div className={cs.dCardBody}>
              <div className={cm.notifyIcons}>
                <span className={client.notifyEmail ? cm.notifyOn : cm.notifyOff}>
                  <FiMail size={13} /> Email {client.notifyEmail ? "enabled" : "disabled"}
                </span>
                <span className={client.notifyWhatsapp ? cm.notifyOn : cm.notifyOff}>
                  <FiPhone size={13} /> WhatsApp {client.notifyWhatsapp ? "enabled" : "disabled"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
