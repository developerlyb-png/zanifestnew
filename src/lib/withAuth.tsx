// lib/withAuth.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import jwt from "jsonwebtoken";

export default function withAuth(Component: any, allowedRoles: string[]) {
  return function AuthenticatedComponent(props: any) {
    const router = useRouter();

    useEffect(() => {
      const token = localStorage.getItem("admin-token");

      if (!token) {
        router.push("/adminlogin"); // or login page
        return;
      }

      try {
        const decoded = jwt.decode(token) as any;

        if (!allowedRoles.includes(decoded.role)) {
          router.push("/unauthorized"); // or 403 page
        }
      } catch (err) {
        localStorage.removeItem("admin-token");
        router.push("/adminlogin");
      }
    }, []);

    return <Component {...props} />;
  };
}
