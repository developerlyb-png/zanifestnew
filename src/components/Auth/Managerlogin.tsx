import { useState } from "react";
import { useRouter } from "next/router";
import { FaSpinner } from "react-icons/fa"; // Spinner icon
import styles from "@/styles/components/Auth/Login.module.css";
import Image from "next/image";

export default function Managerlogin() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Show loader overlay

    try {
      const res = await fetch("/api/manager/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(true);
        alert(data.message || "Login failed");
        setLoading(false);
        return;
      }

      // ✅ Store token in cookie
      document.cookie = `managerToken=${data.token}; path=/;`;

      // ✅ NEW: Store token in localStorage so dashboard can read
      localStorage.setItem("managerToken", data.token);

      console.log("✅ Manager token saved:", data.token);

      setError(false);

      // ✅ Redirect based on role
      if (data.role === "national") {
        router.push("/nationalmanagerdashboard");
      } else if (data.role === "state") {
        router.push("/statemanagerdashboard");
      } else if (data.role === "district") {
        router.push("/districtmanagerdashboard");
      } else {
        alert("Invalid manager role");
        setLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      {/* ✅ Full-page overlay loader */}
      {loading && (
        <div className={styles.loaderOverlay}>
          <FaSpinner className={styles.loaderIcon} />
          <p className={styles.loaderText}>Please wait...</p>
        </div>
      )}

      <div className={styles.cont}>
        <div className={styles.left}>
          <Image
            src={require("@/assets/loginbanner.png")}
            alt="image"
            className={styles.leftImage}
          />
        </div>

        <div className={styles.loginCont}>
          <div className={styles.formDiv}>
            <div className={styles.logo}>
              <Image
                src={require("@/assets/logo.png")}
                alt="logo"
                className={styles.logoImage}
              />
            </div>

            <h1 className={styles.heading}>Manager Login to continue</h1>
           

            <form className={styles.loginForm} onSubmit={handleSubmit}>
              <div className={styles.error}>
                {error && <h4>Invalid Credentials</h4>}
              </div>

              <div className={styles.formInput}>
                <input
                  type="text"
                  name="email"
                  id="email"
                  placeholder="E-mail Address"
                  required
                  className={styles.input}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className={styles.formInput}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="pass"
                  id="pass"
                  placeholder="Password"
                  required
                  className={styles.input}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className={styles.showPasswordDiv}>
                <input
                  type="checkbox"
                  id="showP"
                  className={styles.passCheck}
                  onClick={() => setShowPassword(!showPassword)}
                />
                <label htmlFor="showP">Show Password</label>
              </div>

              <button className={styles.loginButton} type="submit">
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
