import React, { useEffect, useState } from "react";
import styles from "@/styles/components/superadminsidebar/adminlist.module.css";
import Image from "next/image";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Input, message, Select } from "antd";

const { Option } = Select;

type Admin = {
  _id: string;
  userFirstName: string;
  userLastName: string;
  email: string;
  role: string;
};

const ITEMS_PER_PAGE = 5;

export default function AdminList() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");

  const totalPages = Math.ceil(admins.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

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

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleDelete = async (id: string) => {
    if (id === currentAdminId) {
      message.warning("You cannot delete your own account");
      return;
    }

    try {
      const res = await axios.delete(`/api/admin/deleteadmin?id=${id}`, {
        withCredentials: true,
      });

      if (res.status === 200) {
        message.success("Admin deleted successfully");
        setAdmins((prevAdmins) => prevAdmins.filter((a) => a._id !== id));
      } else {
        message.error("Failed to delete admin");
      }
    } catch (error: any) {
      console.error("Error deleting admin:", error);
      message.error(error?.response?.data?.message || "Error deleting admin");
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setSortBy("name");
    setCurrentPage(1);
  };

  // FILTERS + SEARCH + SORT
  const filteredAdmins = admins
    .filter((admin) =>
      `${admin.userFirstName} ${admin.userLastName} ${admin.email} ${admin.role}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    .filter((admin) => roleFilter === "all" || admin.role === roleFilter)
    .sort((a, b) => {
      if (sortBy === "name")
        return a.userFirstName.localeCompare(b.userFirstName);
      if (sortBy === "email") return a.email.localeCompare(b.email);
      return a.role.localeCompare(b.role);
    });

  const currentAdmins = filteredAdmins.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Admin List</h1>

      {/* Filters + Search */}
      <div className={styles.topBar}>
        <div className={styles.leftFilters}>
          <Select value={sortBy} onChange={setSortBy} className={styles.select}>
            <Option value="name">Sort by Name (A-Z)</Option>
            <Option value="email">Sort by Email</Option>
            <Option value="role">Sort by Role</Option>
          </Select>

          <Select
            value={roleFilter}
            onChange={setRoleFilter}
            className={styles.select}
          >
            <Option value="all">All Roles</Option>
            <Option value="admin">Admin</Option>
            <Option value="superadmin">SuperAdmin</Option>
          </Select>

          <button onClick={handleReset} className={styles.resetButton}>
            Reset
          </button>
        </div>

        <div className={styles.rightSearch}>
          <Input.Search
            placeholder="Search by name, email, or role"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.search}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loaderWrapper}>
          <Image
            src={require("@/assets/Material wave loading.gif")}
            alt="Loading..."
            width={100}
            height={100}
            className={styles.logoAnimation}
          />
        </div>
      ) : currentAdmins.length === 0 ? (
        <p className={styles.noData}>No admins found.</p>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>S.No</th>
                  <th className={styles.th}>Name</th>
                  <th className={styles.th}>Email</th>
                  <th className={styles.th}>Role</th>
                  <th className={styles.th}>Delete</th>
                </tr>
              </thead>

              <tbody>
                {currentAdmins.map((admin, index) => {
                  const isSelf = admin._id === currentAdminId;
                  return (
                    <tr key={admin._id} className={styles.row}>
                      <td className={styles.td}>
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>

                      <td
                        className={styles.td}
                      >{`${admin.userFirstName} ${admin.userLastName}`}</td>

                      <td className={styles.td}>{admin.email}</td>

                      <td className={styles.td}>{admin.role}</td>

                      <td className={styles.td}>
                        {isSelf ? (
                          <span className={styles.naStatus} title="You cannot delete your own account">
                            —
                          </span>
                        ) : (
                          <button
                            className={styles.binButton}
                            onClick={() => handleDelete(admin._id)}
                          >
                            {/* Trash bin animation */}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 39 7"
                              className={styles.binTop}
                            >
                              <line
                                strokeWidth="4"
                                stroke="white"
                                y2="5"
                                x2="39"
                                y1="5"
                              ></line>
                              <line
                                strokeWidth="3"
                                stroke="white"
                                y2="1.5"
                                x2="26.0357"
                                y1="1.5"
                                x1="12"
                              ></line>
                            </svg>

                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 33 39"
                              className={styles.binBottom}
                            >
                              <mask fill="white" id="path-1-inside-1_8_19">
                                <path d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z"></path>
                              </mask>
                              <path
                                mask="url(#path-1-inside-1_8_19)"
                                fill="white"
                                d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
                              ></path>

                              <path strokeWidth="4" stroke="white" d="M12 6L12 29"></path>
                              <path strokeWidth="4" stroke="white" d="M21 6V29"></path>
                            </svg>

                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 89 80"
                              className={styles.garbage}
                            >
                              <path
                                fill="white"
                                d="M20.5 10.5L37.5 15.5L42.5 11.5L51.5 12.5L68.75 0L72 11.5L79.5 12.5H88.5L87 22L68.75 31.5L75.5066 25L86 26L87 35.5L77.5 48L70.5 49.5L80 50L77.5 71.5L63.5 58.5L53.5 68.5L65.5 70.5L45.5 73L35.5 79.5L28 67L16 63L12 51.5L0 48L16 25L22.5 17L20.5 10.5Z"
                              ></path>
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={styles.pagination}>
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={styles.pageButton}
            >
              Previous
            </button>

            <span className={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={styles.pageButton}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
