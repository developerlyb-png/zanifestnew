"use client";
import React, { useEffect, useState } from "react";
import styles from "@/styles/components/superadminsidebar/sharedTable.module.css";
import { toast } from "react-hot-toast";
import { FiDownload, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import { FaEdit } from "react-icons/fa";
import CreateManager from "./createmanager";

interface Manager {
  _id: string;
  managerId: string;
  firstName: string;
  lastName: string;
  email: string;
  category: string;
  city: string;
  district: string;
  state: string;
  accountStatus: "active" | "inactive";
  assignedTo?: {
    managerId: string;
    firstName: string;
    lastName: string;
  };
}

const ITEMS_PER_PAGE = 8;

const initials = (m: Manager) =>
  `${(m.firstName || "?").charAt(0)}${(m.lastName || "").charAt(0)}`.toUpperCase();

export default function ManagersTable() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [editingManagerAssinedTo, setEditingManagerAssignedTo] =
    useState<string | null>(null);
  const [newAssignedTo, setNewAssignedTo] = useState<string>("");

  const fetchManagers = async () => {
    try {
      const res = await fetch("/api/getallmanagers");
      const data = await res.json();
      setManagers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching managers:", err);
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const res = await fetch(`/api/manager/updateAccountStatus?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountStatus: newStatus }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Manager status updated to ${newStatus}`);
        setManagers((prevManagers) =>
          prevManagers.map((m) =>
            m._id === id ? { ...m, accountStatus: newStatus } : m
          )
        );
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating manager status");
    }
  };

  const handleSaveAssignedTo = async (managerId: string) => {
    try {
      const res = await fetch(`/api/manager/${managerId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: newAssignedTo }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Manager assigned successfully");
        setManagers((prev) =>
          prev.map((m) => (m._id === managerId ? data.manager : m))
        );
        setEditingManagerAssignedTo(null);
        setNewAssignedTo("");
      } else {
        toast.error(data.message || "Failed to assign manager");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error assigning manager");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this manager?")) return;
    try {
      const res = await fetch(`/api/manager/deletemanager?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Manager deleted successfully");
        setManagers((prevManagers) =>
          prevManagers.filter((m) => m._id !== id)
        );
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting manager (serverside error)");
    }
  };

  const exportCsv = () => {
    const headers = ["Employee Code", "Name", "Email", "Category", "City", "State", "District", "Status"];
    const rows = filteredManagers.map((m) => [
      m.managerId,
      `${m.firstName} ${m.lastName}`,
      m.email,
      m.category,
      m.city,
      m.state,
      m.district,
      m.accountStatus,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "managers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredManagers = managers
    .filter((m) =>
      `${m.firstName} ${m.lastName} ${m.email} ${m.managerId}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    )
    .filter((m) => categoryFilter === "all" || m.category === categoryFilter)
    .sort((a, b) => (a.firstName + " " + a.lastName).localeCompare(b.firstName + " " + b.lastName));

  const totalPages = Math.max(1, Math.ceil(filteredManagers.length / ITEMS_PER_PAGE));
  const paginatedManagers = filteredManagers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Managers</h2>
        <div className={styles.headerActions}>
          <button className={styles.primaryBtn} onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? <FiX /> : <FiPlus />} {showCreate ? "Close" : "Add Manager"}
          </button>
          <button className={styles.exportBtn} onClick={exportCsv}>
            <FiDownload /> Export
          </button>
        </div>
      </div>

      {showCreate && (
        <div className={styles.createPanel}>
          <CreateManager
            mode="create"
            onSuccess={() => {
              setShowCreate(false);
              fetchManagers();
            }}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.pillGroup}>
            {[
              { key: "all", label: "All" },
              { key: "district", label: "District" },
              { key: "state", label: "State" },
              { key: "national", label: "National" },
            ].map((f) => (
              <button
                key={f.key}
                className={`${styles.pill} ${categoryFilter === f.key ? styles.pillActive : ""}`}
                onClick={() => {
                  setCategoryFilter(f.key);
                  setCurrentPage(1);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className={styles.toolbarRight}>
            <div className={styles.searchBox}>
              <FiSearch size={14} />
              <input
                placeholder="Search by name, email, or code"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className={styles.emptyState}>Loading managers...</div>
        ) : paginatedManagers.length === 0 ? (
          <div className={styles.emptyState}>No managers found.</div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Email</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedManagers.map((manager) => (
                    <tr key={manager._id}>
                      <td>
                        <span className={styles.nameCell}>
                          <span className={styles.avatar}>{initials(manager)}</span>
                          {manager.firstName} {manager.lastName}
                        </span>
                      </td>
                      <td>{manager.managerId}</td>
                      <td>{manager.email}</td>
                      <td>
                        <span className={styles.badge + " " + styles.badgeInfo}>
                          {manager.category.charAt(0).toUpperCase() + manager.category.slice(1)}
                        </span>
                      </td>
                      <td>{[manager.city, manager.district, manager.state].filter(Boolean).join(", ")}</td>
                      <td>
                        {editingManagerAssinedTo === manager._id ? (
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <select
                              className={styles.selectPill}
                              value={newAssignedTo}
                              onChange={(e) => setNewAssignedTo(e.target.value)}
                            >
                              <option value="">Select Manager</option>
                              {managers.map((m) => (
                                <option key={m._id} value={m.managerId}>
                                  {`${m.firstName} ${m.lastName} (${m.managerId})`}
                                </option>
                              ))}
                            </select>
                            <button
                              className={styles.actionBtn}
                              onClick={() => handleSaveAssignedTo(manager._id)}
                              title="Save"
                            >
                              ✓
                            </button>
                            <button
                              className={styles.actionBtn}
                              onClick={() => setEditingManagerAssignedTo(null)}
                              title="Cancel"
                            >
                              <FiX size={15} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span>{manager.assignedTo ? manager.assignedTo.managerId : "—"}</span>
                            <button
                              className={styles.actionBtn}
                              onClick={() => {
                                setEditingManagerAssignedTo(manager._id);
                                setNewAssignedTo(manager.assignedTo?.managerId || "");
                              }}
                              title="Edit assignment"
                            >
                              <FaEdit size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          className={`${styles.badge} ${
                            manager.accountStatus === "active" ? styles.badgeSuccess : styles.badgeNeutral
                          }`}
                          style={{ border: "none", cursor: "pointer" }}
                          onClick={() => handleToggleStatus(manager._id, manager.accountStatus)}
                          title="Toggle status"
                        >
                          {manager.accountStatus === "active" ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td>
                        <button
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          onClick={() => handleDelete(manager._id)}
                          title="Delete manager"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.pagination}>
              <button
                className={styles.pageNavBtn}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>
              <div className={styles.pageNumbers}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    className={`${styles.pageNumberBtn} ${
                      currentPage === n ? styles.pageNumberActive : ""
                    }`}
                    onClick={() => setCurrentPage(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                className={styles.pageNavBtn}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
