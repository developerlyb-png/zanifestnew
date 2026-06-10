"use client"
import React, {
 useState,
 useEffect
} from "react";
import { useAuth } from "@/context/AuthContext";
import styles from "@/styles/components/ui/Navbar.module.css";
import { useRouter } from "next/router";
import { FaSignInAlt } from "react-icons/fa";
import { IoCloseSharp } from "react-icons/io5";
import { IoIosArrowDown, IoMdMenu } from "react-icons/io";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

const INSURANCE_PRODUCT_LIST = [
  { name: "Family Health Insurance", link: "/health/healthinsurance" },
  { name: "Marine Insurance", link: "/Marine/Marine1" },
  { name: "Travel Insurance", link: "/Travel/Travel1" },
  { name: "Car Insurance", link: "/carinsurance/carinsurance" },
  { name: "2 wheeler Insurance", link: "/TwoWheeler/bikeinsurance" },
  { name: "Shop Insurance", link: "/Shop/Shop1" },
  { name: "Third Party Insurance", link: "/ThirdParty/Thirdparty1" },
  { name: "Commercial Vehicle", link: "/CommercialVehicle/CommercialVehicle1" },
  { name: "Home Insurance", link: "/Home/Homeinsurance" },
  { name: "Office Package Policy", link: "/officepackagepolicy/officepackagepolicy" },
  { name: "Doctor Indemnity Insurance", link: "/DoctorInd/DoctorInsurance" },
  {
    name: "Director & Officer Liability Insurance",
    link: "/DirectorOfficerLiabilityInsurance/DirectorInsurance1",
  },
];


function Navbar() {
  const router = useRouter();
  const { isLoggedIn, logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [listIndex, setListIndex] = useState<number>(0);
const [otpUser,setOtpUser] =
useState<any>(null);

const [showUserMenu,setShowUserMenu] =
useState(false);

useEffect(()=>{


const loadUser = () => {


const saved =
localStorage.getItem("user");


if(
 saved &&
 saved !== "undefined"
){


try{


setOtpUser(
JSON.parse(saved)
);


}
catch(error){


localStorage.removeItem("user");

setOtpUser(null);


}


}
else{


setOtpUser(null);


}


};


loadUser();


window.addEventListener(
"userLogin",
loadUser
);


return()=>{

window.removeEventListener(
"userLogin",
loadUser
);

};


},[]);
  return (
    <div className={styles.cont}>
      {/* LOGO */}
      <div className={styles.logoCont} onClick={() => router.push("/")}>
        <h3 className={styles.logo}>
          <Image
            src={require("@/assets/logo.png")}
            alt="logo"
            className={styles.logoImage}
          />
        </h3>
      </div>

      {/* MOBILE MENU ICON */}
      <div
        className={styles.openMenu}
        onClick={() => setShowMobileMenu(true)}
      >
        <IoMdMenu />
      </div>

      {/* ================= MOBILE MENU ================= */}
      {showMobileMenu && (
        <div className={styles.mobileMenuList}>
          
          {/* 🔥 MOBILE HEADER */}
          <div className={styles.mobileHeader}>
            <div
              className={styles.mobileLogo}
              onClick={() => {
                router.push("/");
                setShowMobileMenu(false);
              }}
            >
              <Image
                src={require("@/assets/logo.png")}
                alt="logo"
                className={styles.mobileLogoImage}
              />
            </div>

            <div
              className={styles.mobileClose}
              onClick={() => setShowMobileMenu(false)}
            >
              <IoCloseSharp />
            </div>
          </div>

          {/* HOME */}
          <div className={styles.menuItem} onClick={() => router.push("/")}>
            <div className={`${styles.heading} ${styles.headingBlue}`}>
              Home
            </div>
            <div className={styles.totalLine}></div>
          </div>

          {/* INSURANCE PRODUCT */}
          <div
            className={styles.menuItem}
            onClick={() => setListIndex(listIndex === 2 ? 0 : 2)}
          >
            <div className={`${styles.heading} ${styles.activeMenu}`}>
              Insurance Product
              <div className={styles.mobilearrow}>
                <IoIosArrowDown />
              </div>
            </div>
            <div className={styles.totalLine}></div>

            <AnimatePresence>
              {listIndex === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className={styles.dropDownMobile}
                >
                  {INSURANCE_PRODUCT_LIST.map((item, index) => (
                    <div
                      key={index}
                      className={styles.dropItemMobile}
                      onClick={() => {
                        router.push(item.link);
                        setShowMobileMenu(false);
                      }}
                    >
                      {item.name}
                      <div className={styles.totalLine}></div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ABOUT */}
          <div
            className={styles.menuItem}
            onClick={() => router.push("/about")}
          >
            <div className={`${styles.heading} ${styles.headingBlue}`}>
              About Us
            </div>
            <div className={styles.totalLine}></div>
          </div>

          {/* CONTACT */}
          <div
            className={styles.menuItem}
            onClick={() => router.push("/contact")}
          >
            <div className={`${styles.heading} ${styles.headingBlue}`}>
              Contact Us
            </div>
            <div className={styles.totalLine}></div>
          </div>

          {/* LOGIN / LOGOUT */}
          {!otpUser && !isLoggedIn ? (
            <div
              className={styles.loginButton}
              onClick={() => router.push("/login")}
            >
              <p className={styles.loginText}>
                Login/Register <FaSignInAlt />
              </p>
            </div>
          ) : (
           <div
className={styles.loginButton}
onClick={() => {

 if(otpUser){

  router.push("/dashboard");

 }
 else{

  logout();

 }

}}
>

<p className={styles.loginText}>

{
otpUser
?
`👤 ${otpUser.name}`
:
"Logout"
}

</p>

</div>
          )}
        </div>
      )}

      {/* ================= DESKTOP MENU (UNCHANGED) ================= */}
      <div className={styles.menuCont}>
        <div className={styles.menuItem} onClick={() => router.push("/")}>
          <div className={`${styles.heading} ${styles.headingBlue}`}>Home</div>
        </div>

        <div className={styles.menuItem}>
          <div className={`${styles.heading} ${styles.activeMenu}`}>
            Insurance Product
            <div className={styles.arrow}>
              <IoIosArrowDown />
            </div>
          </div>

          <div className={styles.dropDown}>
            {INSURANCE_PRODUCT_LIST.map((item, index) => (
              <div
                key={index}
                className={styles.dropItem}
                onClick={() => router.push(item.link)}
              >
                {item.name}
              </div>
            ))}
          </div>
        </div>

        <div
          className={styles.menuItem}
          onClick={() => router.push("/about")}
        >
          <div className={`${styles.heading} ${styles.headingBlue}`}>
            About Us
          </div>
        </div>

        <div
          className={styles.menuItem}
          onClick={() => router.push("/contact")}
        >
          <div className={`${styles.heading} ${styles.headingBlue}`}>
            Contact Us
          </div>
        </div>
      </div>

      {/* DESKTOP LOGIN */}
  <div className={styles.loginCont}>

{
otpUser ?

(

<div style={{position:"relative"}}>


<div
className={styles.loginButton}
onClick={() =>
setShowUserMenu(!showUserMenu)
}
>

<p className={styles.loginText}>

👤 {otpUser.name}

</p>

</div>



{
showUserMenu &&

<div className={styles.userDropdown}>


<p
onClick={()=>{

router.push("/dashboard");

setShowUserMenu(false);

}}
>

Dashboard

</p>



<p
onClick={()=>{

localStorage.removeItem("user");

setOtpUser(null);

setShowUserMenu(false);

logout();

}}
>

Logout

</p>


</div>

}


</div>

)


:

isLoggedIn ?

(

<div
className={styles.loginButton}
onClick={logout}
>

<p className={styles.loginText}>

Logout

</p>

</div>

)


:

(

<div
className={styles.loginButton}
onClick={() => router.push("/login")}
>

<p className={styles.loginText}>

Login/Register

<FaSignInAlt
style={{
position:"relative",
top:"5px"
}}
/>

</p>

</div>

)

}

</div>
    </div>
  );
}

export default Navbar;
