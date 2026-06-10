
// import React, { useEffect, useState } from "react";
// import Image from "next/image";
// import { useRouter } from "next/router";
// import logo from "@/assets/logo.png";
// import styles from "@/styles/pages/admin/userlist.module.css";

// function UsersPage() {
//   const router = useRouter();
//   const [users, setUsers] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   const fetchUsers = async () => {
//     try {
//       const response = await fetch("/api/users");
//       if (response.status === 401) {
//         alert("Unauthorized. Please login.");
//         router.push("/adminlogin");
//         return;
//       }
//       const data = await response.json();
//       setUsers(data);
//     } catch (error) {
//       console.error("Failed to fetch users:", error);
//       alert("Something went wrong!");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const handleLogout = () => {
//     router.push("/agentlogin");
//   };

//   return (
//     <div className={styles.container}>
//       {/* <header className={styles.header}>
//         <div className={styles.logoContainer}>
//           <Image src={logo} alt="Logo" width={120} height={40} className={styles.logo} />
//         </div>
//         <button className={styles.logoutButton} onClick={handleLogout}>
//           Logout
//         </button>
//       </header> */}

//       <h1 className={styles.heading}>Registered Users</h1>

//       {loading ? (
// <div className={styles.loaderWrapper}>
//     <Image
//             src={require("@/assets/Material wave loading.gif")}
//       alt="Loading..."
//       width={100}
//       height={100}
//       className={styles.logoAnimation}
//     />
//   </div>            ) : (
//         <div className={styles.tableWrapper}>
//           <table className={styles.table}>
//             <thead>
//               <tr>
//                 <th className={styles.th}>Username</th>
//                 <th className={styles.th}>Email</th>
//               </tr>
//             </thead>
//             <tbody>
//               {users.map((user) => (
//                 <tr key={user._id} className={styles.row}>
//                   <td className={styles.td}>{user.userName}</td>
//                   <td className={styles.td}>{user.email}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }

// export default UsersPage;
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import logo from "@/assets/logo.png";
import styles from "@/styles/pages/admin/userlist.module.css";

function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.status === 401) {
        alert("Unauthorized. Please login.");
        router.push("/adminlogin");
        return;
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const paginatedUsers = users.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleLogout = () => {
    router.push("/agentlogin");
  };

  return (
    <div className={styles.container}>
      {/* <header className={styles.header}>
        <div className={styles.logoContainer}>
          <Image src={logo} alt="Logo" width={120} height={40} className={styles.logo} />
        </div>
        <button className={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </header> */}

      <h1 className={styles.heading}>Registered Users</h1>

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
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Username</th>
                  <th className={styles.th}>Email</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user._id} className={styles.row}>
                    <td className={styles.td}>{user.userName}</td>
                    <td className={styles.td}>{user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageButton}
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <span className={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className={styles.pageButton}
                onClick={goToNextPage}
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

export default UsersPage;
