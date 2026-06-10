// 'use client';

// import React, { useEffect, useState } from 'react';
// import styles from '@/styles/components/superadminsidebar/managerlist.module.css';
// import Image from 'next/image';
// import { toast } from 'react-hot-toast';
// import { span } from 'framer-motion/client';

// interface Manager {
//     _id: string;
//     managerId: string;
//     firstName: string;
//     lastName: string;
//     email: string;
//     category: string;
//     city: string;
//     district: string;
//     state: string;
//     accountStatus: 'active' | 'inactive';
//     assignedTo?: {
//     managerId: string;
//     firstName: string;
//     lastName: string;
//     }
// }

// export default function ManagersTable() {
//   const [managers, setManagers] = useState<Manager[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;
//   const [ editingManagerAssinedTo, setEditingManagerAssignedTo]
//  = useState<string | null>(null);
//   const [newAssignedTo, setNewAssignedTo] = useState<string>('');

//   //to get all mnanagers
//   const fetchManagers = async () => {
//       try {
//         const res = await fetch('/api/getallmanagers');
//         const data = await res.json();
//         setManagers(data);
//       } catch (err) {
//         console.error('Error fetching managers:', err);
//         toast.error('Something went wrong!');
//       } finally {
//         setLoading(false);
//       }
//     };

//     //activate/inactivate` manager
//   const handleToggleStatus = async (id: string, currentStatus: string) => {
//     try {
//       const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

//       const res = await fetch(`/api/manager/updateAccountStatus?id=${id}`, {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ accountStatus: newStatus }),
//       });

//       const data = await res.json();

//       if (data.success) {
//         toast.success(`Manager status updated to ${newStatus}`);
//         // ✅ update state immediately
//         setManagers((prevManagers) =>
//           prevManagers.map((m) =>
//             m._id === id ? { ...m, accountStatus: newStatus } : m
//           )
//         );
//       } else {
//         toast.error(data.message || 'Failed to update status');
//       }
//     } catch (err) {
//       console.error(err);
//       toast.error('Error updating manager status');
//     }
//   };

//   //fetch managers whenever the page loads

//   useEffect(() => {
//     fetchManagers();
//   }, []);

//   const handleSaveAssignedTo = async(managerId: string) => {
//     try
//     {
//       const res = await fetch(`/api/manager/${managerId}/assign`, {
//         method: "PUT",
//         headers : { "Content-Type": "application/json" },
//         body: JSON.stringify({ assignedTo: newAssignedTo}),
//       })

//       const data = await res.json();

//       if(data.success)
//       {
//         toast.success("Manager assigned successfully");

//         setManagers( (prev)=> prev.map((m)=> (m._id === managerId ? data.manager : m)));

//         setEditingManagerAssignedTo(null);
//          setNewAssignedTo('');
//       }

//       else{
//         toast.error(data.message || "Failed to assign manager");
//       }

//   }catch(e){
//       console.error(e);
//       toast.error("Error assigning manager");
//     }
//   };

//  const handleDelete = async (id: string) => {
//   try {
//     //get response from calling api
//     const res = await fetch(`/api/manager/deletemanager?id=${id}`, {
//       method: 'DELETE',
//     });

//     //store json type response in data variable
//     const data = await res.json();

//     if (data.success) {
//       toast.success('Manager deleted successfully');
//       // fetchManagers(); // refresh table after delete

//           // ✅ Update state immediately so UI refreshes
//     setManagers((prevManagers) => prevManagers.filter((m) => m._id !== id));
//     }

//     else {
//       toast.error(data.message);
//     }
//   }

//   catch (err) {
//     console.error(err);
//     toast.error('Error deleting manager (serverside error)');
//   }
// };

//   const totalPages = Math.ceil(managers.length / itemsPerPage);
//   const paginatedManagers = managers.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   const goToPreviousPage = () => {
//     if (currentPage > 1) setCurrentPage(currentPage - 1);
//   };

//   const goToNextPage = () => {
//     if (currentPage < totalPages) setCurrentPage(currentPage + 1);
//   };

//   return (
//     <div className={styles.container}>
//       <h1 className={styles.heading}>All Managers</h1>

//       {loading ? (
//         <div className={styles.loaderWrapper}>
//           <Image
//             src={require('@/assets/Material wave loading.gif')}
//             alt="Loading..."
//             width={100}
//             height={100}
//             className={styles.logoAnimation}
//           />
//         </div>
//       ) : (
//         <>
//           <div className={styles.tableWrapper}>
//             <table className={styles.table}>
//               <thead>
//                 <tr>
//                   <th className={styles.th}>S.No</th>
//                   <th className={styles.th}>Employee Code</th>
//                   <th className={styles.th}>Name</th>
//                   <th className={styles.th}>Email</th>
//                   <th className={styles.th}>Category</th>
//                   <th className={styles.th}>City</th>
//                   <th className={styles.th}>State</th>
//                   <th className={styles.th}>District</th>
//                   <th className={styles.th}>Assigned To</th>
//                   <th className={styles.th}>Status</th>
//                   <th className={styles.th}>Delete</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {paginatedManagers.map((manager, index) => (
//                   <tr key={manager._id} className={styles.row}>
//                     <td className={styles.td}>
//                       {(currentPage - 1) * itemsPerPage + index + 1}
//                     </td>
//                     <td className={styles.td}>{manager.managerId}</td>
//                     <td className={styles.td}>{`${manager.firstName} ${manager.lastName}`}</td>
//                     <td className={styles.td}>{manager.email}</td>
//                     <td className={styles.td}>{`${manager.category.charAt(0).toUpperCase() + manager.category.slice(1)}` + " " + "Manager"}</td>
//                     <td className={styles.td}>{manager.city}</td>
//                     <td className={styles.td}>{manager.state}</td>
//                     <td className={styles.td}>{manager.district}</td>
//                     <td className={styles.td}>
//                       {/* {manager.assignedTo
//                         ? `${manager.assignedTo.managerId}`
//                         : '—'} */}

//                         {
//                           editingManagerAssinedTo === manager._id ? (
//                             <>
//                             <select
//                             value={newAssignedTo}
//                             onChange={(e) => setNewAssignedTo(e.target.value)}
//                             >
//                             <option value = "">Select New Manager</option>
//                             {managers.map((m)=> (
//                               <option key={manager._id} value={manager.managerId}>
//                                 {`${manager.firstName} ${manager.lastName} (${manager.managerId})`}
//                               </option>
//                             ) )}
//                              </select>
//                              <button onClick={()=> handleSaveAssignedTo(manager._id)}>Save</button>
//                              <button onClick={()=>setEditingManagerAssignedTo(null)}>Cancel</button>

//                             </>
//                           ):(
//                             <>
//                             {manager.assignedTo ?
//                           <span> {manager.assignedTo.managerId}</span>  :
//                           <span>—</span>
//                           }
//                           <button
//                           onClick={()=> {
//                             setEditingManagerAssignedTo(manager._id);
//                             setNewAssignedTo(manager.assignedTo?.managerId || 'this is not assignable'
//                             );
//                           }}
//                           >
//                             Edit
//                           </button>
//                             </>
//                           )
//                         }
//                     </td>
//                     <td className={styles.td}>
//                       <button
//                         className={`${styles.editButton} ${
//                           manager.accountStatus === 'active' ? styles.active : styles.inactive
//                         }`}
//                         onClick={() => handleToggleStatus(manager._id, manager.accountStatus)}
//                       >
//                         {manager.accountStatus === 'active' ? 'Active' : 'Inactive'}
//                       </button>
//                     </td>
//                     <td className={styles.td}>
//                       <button className={styles.deleteButton} onClick={()=> handleDelete(manager._id)}>Delete</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {/* Pagination Controls */}
//           {totalPages > 1 && (
//             <div className={styles.pagination}>
//               <button
//                 className={styles.pageButton}
//                 onClick={goToPreviousPage}
//                 disabled={currentPage === 1}
//               >
//                 Prev
//               </button>
//               <span className={styles.pageInfo}>
//                 Page {currentPage} of {totalPages}
//               </span>
//               <button
//                 className={styles.pageButton}
//                 onClick={goToNextPage}
//                 disabled={currentPage === totalPages}
//               >
//                 Next
//               </button>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// }
"use client";
import React, { useEffect, useState } from "react";
import styles from "@/styles/components/superadminsidebar/managerlist.module.css";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { FaEdit } from "react-icons/fa";

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

export default function ManagersTable() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [filteredManagers, setFilteredManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Filters
  const [sortBy, setSortBy] = useState("name");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [editingManagerAssinedTo, setEditingManagerAssignedTo] =
    useState<string | null>(null);
  const [newAssignedTo, setNewAssignedTo] = useState<string>("");

  // fetch all managers
  const fetchManagers = async () => {
    try {
      const res = await fetch("/api/getallmanagers");
      const data = await res.json();
      setManagers(data);
      setFilteredManagers(data);
    } catch (err) {
      console.error("Error fetching managers:", err);
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  // toggle active/inactive
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

  useEffect(() => {
    fetchManagers();
  }, []);

  // ✅ Filter + Search + Sort Apply
  useEffect(() => {
    let result = [...managers];

    // search
    if (searchQuery) {
      result = result.filter(
        (m) =>
          m.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.managerId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // category
    if (categoryFilter) {
      result = result.filter((m) => m.category === categoryFilter);
    }

    // status
    if (statusFilter) {
      result = result.filter((m) => m.accountStatus === statusFilter);
    }

    // sort
    if (sortBy === "name") {
      result.sort((a, b) =>
        (a.firstName + " " + a.lastName).localeCompare(
          b.firstName + " " + b.lastName
        )
      );
    } else if (sortBy === "email") {
      result.sort((a, b) => a.email.localeCompare(b.email));
    }

    setFilteredManagers(result);
    setCurrentPage(1);
  }, [managers, sortBy, categoryFilter, statusFilter, searchQuery]);

  // ✅ Reset filters
  const handleResetFilters = () => {
    setSortBy("name");
    setCategoryFilter("");
    setStatusFilter("");
    setSearchQuery("");
    setFilteredManagers(managers);
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

  const totalPages = Math.ceil(filteredManagers.length / itemsPerPage);
  const paginatedManagers = filteredManagers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>All Managers</h1>

      {/* ✅ Filters & Search */}
      <div className={styles.filtersBar}>
        {/* Left side */}
        <div className={styles.filtersLeft}>
          {/* Sort */}
          <select
            className={styles.filterSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort by Name (A-Z)</option>
            <option value="email">Sort by Email (A-Z)</option>
          </select>

          {/* Category */}
          <select
            className={styles.filterSelect}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="district">District Manager</option>
            <option value="state">State Manager</option>
            <option value="national">National Manager</option>
          </select>

          {/* Status */}
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Reset */}
          <button className={styles.resetButton} onClick={handleResetFilters}>
            Reset
          </button>
        </div>

        {/* Right side search */}
        <div className={styles.filtersRight}>
          <input
            type="text"
            placeholder="Search by name, email, or role"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
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
      ) : (
        <>
          {/* Table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>S.No</th>
                  <th className={styles.th}>Employee Code</th>
                  <th className={styles.th}>Name</th>
                  <th className={styles.th}>Email</th>
                  <th className={styles.th}>Category</th>
                  <th className={styles.th}>City</th>
                  <th className={styles.th}>State</th>
                  <th className={styles.th}>District</th>
                  <th className={styles.th}>Assigned To</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Delete</th>
                </tr>
              </thead>
              <tbody>
                {paginatedManagers.map((manager, index) => (
                  <tr key={manager._id} className={styles.row}>
                    <td className={styles.td}>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className={styles.td}>{manager.managerId}</td>
                    <td className={styles.td}>
                      {`${manager.firstName} ${manager.lastName}`}
                    </td>
                    <td className={styles.td}>{manager.email}</td>
                    <td className={styles.td}>
                      {`${
                        manager.category.charAt(0).toUpperCase() +
                        manager.category.slice(1)
                      } Manager`}
                    </td>
                    <td className={styles.td}>{manager.city}</td>
                    <td className={styles.td}>{manager.state}</td>
                    <td className={styles.td}>{manager.district}</td>

                    {/* Assigned To */}
                    <td className={styles.td}>
                      {editingManagerAssinedTo === manager._id ? (
                        <>
                          <select
                            value={newAssignedTo}
                            onChange={(e) => setNewAssignedTo(e.target.value)}
                          >
                            <option value="">Select New Manager</option>
                            {managers.map((m) => (
                              <option key={m._id} value={m.managerId}>
                                {`${m.firstName} ${m.lastName} (${m.managerId})`}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleSaveAssignedTo(manager._id)}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingManagerAssignedTo(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <div className={styles.assignedToCell}>
                          {manager.assignedTo ? (
                            <span>{manager.assignedTo.managerId}</span>
                          ) : (
                            <span>—</span>
                          )}
                          <button
                            onClick={() => {
                              setEditingManagerAssignedTo(manager._id);
                              setNewAssignedTo(
                                manager.assignedTo?.managerId || ""
                              );
                            }}
                            className={styles.iconButton}
                          >
                            <FaEdit color="green" size={16} />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td className={styles.td}>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={manager.accountStatus === "active"}
                          onChange={() =>
                            handleToggleStatus(
                              manager._id,
                              manager.accountStatus
                            )
                          }
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </td>

                    {/* Delete */}
                    <td className={styles.td}>
                      <button
                        className={styles.binButton}
                        onClick={() => handleDelete(manager._id)}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageButton}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <span className={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className={styles.pageButton}
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
