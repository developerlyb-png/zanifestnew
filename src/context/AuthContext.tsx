"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/router";

interface User {
  name: string;
  email: string;
  role?: "user" | "admin";

}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
    isAdmin: boolean;    
  logout: () => void;
  setUser: (u: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();


  useEffect(() => {
    const checkLogin = async () => {
      try {
        const userRes = await fetch("/api/users/me", { credentials: "include" });
        if (userRes.ok) {
          const d = await userRes.json();
          setUser({ name: d.name, email: d.email, role: "user" });
          setLoading(false);
          return;
        }

        const adminRes = await fetch("/api/admin/me", { credentials: "include" });
        if (adminRes.ok) {
          const d = await adminRes.json();
          setUser({ name: d.name || "Admin", email: d.email, role: "admin" });
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLogin();
  }, []);


   const logout = async () => {
    try {
      await fetch("/api/users/logout", { method: "POST" });
      await fetch("/api/admin/logout", { method: "POST" });
    } catch (err) {
      // ignore
    } finally {
      setUser(null);
      router.push("/login");
    }
  };
  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isAdmin: user?.role === "admin", 
loading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};