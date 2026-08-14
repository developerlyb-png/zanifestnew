import React, { useEffect, useState } from "react";
import styles from "@/styles/components/superadminsidebar/sharedTable.module.css";
import { message } from "antd";
import { FiDownload, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import CreateAdmin from "./createadmin";

type Admin = {
  _id: string;
  userFirstName: string;
  userLastName: string;
  email: string;
  role: string;
};

const ITEMS_PER_PAGE = 8;

const initials = (a: Admin) =>
  `${(a.userFirstName || "?").charAt(0)}${(a.userLastName || "").charAt(0)}`.toUpperCase();

export default function AdminList() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/getadmin", { credentials: "include" });
      const data = await res.json();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch admins:", error);
      message.error("Failed to fetch admins");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentAdmin = async () => {
    try {
      const res = await fetch("/api/admin/getadmindetails", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setCurrentAdminId(data?._id || null);
    } catch (error) {
      console.error("Failed to fetch current admin:", error);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchCurrentAdmin();
  }, []);

  const handleDelete = async (id: string) => {
    if (id === currentAdminId) {
      message.warning("You cannot delete your own account");
      return;
    }
    if (!window.confirm("Delete this admin?")) return;

    try {
      const res = await fetch(`/api/admin/deleteadmin?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        message.success("Admin deleted successfully");
        setAdmins((prev) => prev.filter((a) => a._id !== id));
      } else {
        message.error(data.message || "Failed to delete admin");
      }
    } catch (error) {
      console.error("Error deleting admin:", error);
      message.error("Error deleting admin");
    }
  };

  const exportCsv = () => {
    const headers = ["Name", "Email", "Role"];
    const rows = filteredAdmins.map((a) => [
      `${a.userFirstName} ${a.userLastName}`,
      a.email,
      a.role,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "admins.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredAdmins = admins
    .filter((admin) =>
      `${admin.userFirstName} ${admin.userLastName} ${admin.email} ${admin.role}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    .filter((admin) => roleFilter === "all" || admin.role === roleFilter)
    .sort((a, b) => a.userFirstName.localeCompare(b.userFirstName));

  const totalPages = Math.max(1, Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentAdmins = filteredAdmins.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Admins</h2>
        <div className={styles.headerActions}>
          <button className={styles.primaryBtn} onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? <FiX /> : <FiPlus />} {showCreate ? "Close" : "Add Admin"}
          </button>
          <button className={styles.exportBtn} onClick={exportCsv}>
            <FiDownload /> Export
          </button>
        </div>
      </div>

      {showCreate && (
        <div className={styles.createPanel}>
          <CreateAdmin
            mode="create"
            onSuccess={() => {
              setShowCreate(false);
              fetchAdmins();
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
              { key: "admin", label: "Admin" },
              { key: "superadmin", label: "SuperAdmin" },
            ].map((f) => (
              <button
                key={f.key}
                className={`${styles.pill} ${roleFilter === f.key ? styles.pillActive : ""}`}
                onClick={() => {
                  setRoleFilter(f.key);
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
                placeholder="Search by name, email, or role"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className={styles.emptyState}>Loading admins...</div>
        ) : currentAdmins.length === 0 ? (
          <div className={styles.emptyState}>No admins found.</div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAdmins.map((admin) => {
                    const isSelf = admin._id === currentAdminId;
                    return (
                      <tr key={admin._id}>
                        <td>
                          <span className={styles.nameCell}>
                            <span className={styles.avatar}>{initials(admin)}</span>
                            {admin.userFirstName} {admin.userLastName}
                          </span>
                        </td>
                        <td>{admin.email}</td>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              admin.role === "superadmin" ? styles.badgeSuccess : styles.badgeInfo
                            }`}
                          >
                            {admin.role}
                          </span>
                        </td>
                        <td>
                          {isSelf ? (
                            <span style={{ color: "#c7cedd", fontSize: "0.8rem" }} title="You cannot delete your own account">
                              —
                            </span>
                          ) : (
                            <button
                              className={`${styles.actionBtn} ${styles.deleteBtn}`}
                              onClick={() => handleDelete(admin._id)}
                              title="Delete admin"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
