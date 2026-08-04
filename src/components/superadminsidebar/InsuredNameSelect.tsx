"use client";

import React, { useEffect, useState } from "react";
import styles from "@/styles/components/superadminsidebar/InsuredNameSelect.module.css";
import { FiChevronDown, FiRefreshCw } from "react-icons/fi";
import AddClientModal, { ClientRecord } from "./AddClientModal";

interface InsuredNameSelectProps {
  value: ClientRecord | null;
  onSelect: (client: ClientRecord) => void;
  error?: boolean;
}

const InsuredNameSelect: React.FC<InsuredNameSelectProps> = ({ value, onSelect, error }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);

  const fetchClients = () => {
    setLoading(true);
    fetch("/api/admin/clients", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setClients(d.clients || []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (client: ClientRecord) => {
    onSelect(client);
    setOpen(false);
    setSearch("");
  };

  const handleCreated = (client: ClientRecord) => {
    setClients((prev) => [client, ...prev]);
    setShowAddClient(false);
    handleSelect(client);
  };

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={`${styles.trigger} ${error ? styles.errorInput : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={value ? styles.triggerValue : styles.triggerPlaceholder}>
          {value ? value.name : "Select an option..."}
        </span>
        <FiChevronDown />
      </button>

      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <div className={styles.panel}>
            <div className={styles.searchRow}>
              <input
                autoFocus
                className={styles.searchInput}
                placeholder="Search options..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button type="button" className={styles.addInsuredBtn} onClick={() => setShowAddClient(true)}>
              Add Insured
            </button>

            <button type="button" className={styles.refreshBtn} onClick={fetchClients}>
              <FiRefreshCw size={13} /> Refresh
            </button>

            <div className={styles.list}>
              {loading ? (
                <div className={styles.emptyState}>Loading...</div>
              ) : filtered.length === 0 ? (
                <div className={styles.emptyState}>No clients found.</div>
              ) : (
                filtered.map((c) => (
                  <div key={c._id} className={styles.listItem} onClick={() => handleSelect(c)}>
                    <span className={styles.avatar}>{c.name.charAt(0).toUpperCase()}</span>
                    {c.name}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {showAddClient && (
        <AddClientModal onClose={() => setShowAddClient(false)} onCreated={handleCreated} />
      )}
    </div>
  );
};

export default InsuredNameSelect;
