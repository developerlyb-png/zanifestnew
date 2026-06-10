// import { useEffect } from "react";
// import { useRouter } from "next/router";
// import "@/styles/globals.css";
// import { AuthProvider } from "@/context/AuthContext";
// import { Toaster } from "react-hot-toast";
// import { ConfigProvider, App as AntdApp } from "antd";
// import "antd/dist/reset.css"; // reset styles for v5

// import type { AppProps } from "next/app";

// // ✅ Scroll to top on route change
// function ScrollToTop() {
//   const router = useRouter();

//  useEffect(() => {
//   const handleRouteChange = (url: string) => {
//     // Wait a tick to ensure new page DOM is ready
//     setTimeout(() => {
//       window.scrollTo({ top: 0, behavior: "auto" });
//     }, 10);
//   };

//   router.events.on("routeChangeComplete", handleRouteChange);
//   return () => {
//     router.events.off("routeChangeComplete", handleRouteChange);
//   };
// }, []);

//   return null;
// }

// function MyApp({ Component, pageProps }: AppProps) {
//   const router = useRouter();

//   useEffect(() => {
//     // disable browser scroll restore
//     if ("scrollRestoration" in window.history) {
//       window.history.scrollRestoration = "manual";
//     }

//     // force scroll to top on route change
//     const handleRouteChange = () => {
//       requestAnimationFrame(() => {
//         window.scrollTo({ top: 0, left: 0, behavior: "auto" });
//       });
//     };

//     router.events.on("routeChangeComplete", handleRouteChange);

//     return () => {
//       router.events.off("routeChangeComplete", handleRouteChange);
//     };
//   }, [router]);

//   return (
//      <AuthProvider>
//       {/* ✅ Wrap with ConfigProvider */}
//       <ConfigProvider>
//         <AntdApp>
//           <ScrollToTop />
//           <Component {...pageProps} />
//           <Toaster position="top-center" reverseOrder={false} />
//         </AntdApp>
//       </ConfigProvider>
//     </AuthProvider>
//   );
// }

// export default MyApp;
import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import { ConfigProvider, App as AntdApp } from "antd";
import Loader from "@/components/Loader" // ✅ import loader
import "antd/dist/reset.css";

import type { AppProps } from "next/app";
import GlobalAlert from "@/components/GlobalAlert";

function ScrollToTop() {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
      }, 10);
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router]);

  return null;
}

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // ---------------------------
  // Global Loader
  // ---------------------------
  useEffect(() => {
    const handleStart = (url: string) => {
      if (url !== router.asPath) setLoading(true);
    };
    const handleComplete = () => setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  // ---------------------------
  // Scroll restoration
  // ---------------------------
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const handleRouteChange = () => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
    };

    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router]);

  return (
    <AuthProvider>
     <Head>
  <title>zanifest Insurance: Compare & Buy Insurance</title>
  <link rel="icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" href="/favicon.ico" />
  <meta name="theme-color" content="#000000" />
</Head>

      <ConfigProvider>
        <AntdApp>
          <ScrollToTop />
          {loading && <Loader />} {/* ✅ show loader globally */}
          <GlobalAlert/> {/* ✅ Global Alert Component */}
          <Component {...pageProps} />
          <Toaster position="top-center" reverseOrder={false} />
        </AntdApp>
      </ConfigProvider>
    </AuthProvider>
  );
}

export default MyApp;
