import { useState, useEffect } from "react";
// import jwtDecode from "jwt-decode";

type DecodedToken = {
  id: string;
  role: string;
  name?: string;
  email?: string;
};

export function useManager() {
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/manager/getManagerName");
        console.log("Fetching user data from /api/manager/getManagerName");
        if (res.ok) {
          const data = await res.json();
          console.log("User data fetched successfully:", data);
          setUser(data.user); // expecting { name, role, email }
        } else {
            console.log("Failed to fetch user data, response status:", res.status);
          setUser(null);
        }
      } catch (err) {
        console.log("Error fetching user data -> from token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
}
