"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/pages/health/health.module.css";
import { City } from "country-state-city";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import UserDetails from "@/components/ui/UserDetails";

import Image from "next/image";
import { FiSearch } from "react-icons/fi";

import womanicon from "@/assets/pageImages/health/2.webp";
import manicon from "@/assets/health/manicon.webp";
import { useRouter } from "next/router";

const Health = () => {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [gender, setGender] = useState("M");

  const [members, setMembers] = useState<any[]>([]);

  const [ages, setAges] = useState<{ [key: number]: string }>({});

  const [selectedCity, setSelectedCity] = useState("");
  const [citySearch, setCitySearch] = useState("");

  const [allCities, setAllCities] = useState<string[]>([]);
  const popularCities = [
    "Delhi",
    "Bengaluru",
    "Pune",
    "Hyderabad",
    "Mumbai",
    "Thane",
    "Gurgaon",
    "Chennai",
    "Ghaziabad",
    "Ernakulam",
  ];

  const [medical, setMedical] = useState<string[]>([]);

  const diseases = [
    "Diabetes",
    "Blood Pressure",
    "Heart disease",
    "Any Surgery",
    "Thyroid",
    "Asthma",
    "Other disease",
    "None of these",
  ];
  const [fullName, setFullName] = useState("");

  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [otpLoading, setOtpLoading] = useState("");

  const [isOpenIndex, setIsOpenIndex] = useState<number | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const getMemberImage = (member?: any) => {
    return member?.image || (gender === "F" ? womanicon : manicon);
  };

  useEffect(() => {
    const saved = localStorage.getItem("user");

    if (saved && saved !== "undefined") {
      const user = JSON.parse(saved);

      console.log("LOGIN USER FOUND", user);

      setLoggedUser(user);

      // auto fill
      setFullName(user.name || "");
      setEmail(user.email || "");
      setMobile(user.mobile || "");

      // skip OTP validation
      setMobileVerified(true);
      setEmailVerified(true);
    }
  }, []);

  useEffect(() => {
    if (!router.isReady) return;

    if (router.query.gender) {
      setGender(router.query.gender as string);
    }

    if (router.query.members) {
      try {
        const data = JSON.parse(router.query.members as string);

        setMembers(data);
      } catch (error) {
        console.log(error);
      }
    }
  }, [router.isReady]);

  const handleAgeSelect = (index: number, age: string) => {
    setAges((prev) => ({
      ...prev,
      [index]: age,
    }));

    setIsOpenIndex(null);
  };

  const getDOBFromAge = (age: string) => {
    const year = new Date().getFullYear() - Number(age);

    return `${year}-01-01`;
  };

  // ===============================
  // ICICI (Elevate Health) mapping helpers
  // ===============================

  // ICICI dates are dd-MMM-yyyy (e.g. "01-Jan-1995"), not the yyyy-01-01
  // getDOBFromAge produces for Zuno.
  const MONTH_ABBR = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const getIciciDobFromAge = (age: string) => {
    const year = new Date().getFullYear() - Number(age);
    return `01-${MONTH_ABBR[0]}-${year}`;
  };

  // Same relation strings the Zuno mapper above accepts, mapped to ICICI's
  // uppercase relationship codes (Masters Data 3.xlsx "Relationship" sheet).
  const iciciRelationMap: Record<string, string> = {
    self: "SELF",
    wife: "SPOUSE",
    husband: "SPOUSE",
    spouse: "SPOUSE",
    father: "FATHER",
    mother: "MOTHER",
    son: "SON",
    daughter: "DAUGHTER",
    brother: "BROTHER",
    sister: "SISTER",
    "father-in-law": "FATHER_IN_LAW",
    "mother-in-law": "MOTHER_IN_LAW",
    grandfather: "GRANDFATHER",
    grandmother: "GRANDMOTHER",
  };
  const mapIciciRelation = (rel: string) => {
    const key = (rel || "").toLowerCase().trim();
    return iciciRelationMap[key] || (rel || "SELF").toUpperCase();
  };

  // The quote form only collects a city name, not a pincode, but ICICI's
  // Premium API mandates a numeric PinCode (it drives zone-based pricing).
  // Representative pincodes for the popularCities chips below — an
  // approximation until a real pincode field is added to this form; ICICI's
  // returned ZoneName/premium will only be as accurate as this pincode is.
  const CITY_PINCODES: Record<string, string> = {
    Delhi: "110001",
    Bengaluru: "560001",
    Pune: "411001",
    Hyderabad: "500001",
    Mumbai: "400001",
    Thane: "400601",
    Gurgaon: "122001",
    Chennai: "600001",
    Ghaziabad: "201001",
    Ernakulam: "682001",
  };
  const getPincodeForCity = (city: string) => CITY_PINCODES[city] || "110001";

  const postJson = async (url: string, body: Record<string, string>) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || "Request failed");
    }

    return data;
  };

  const sendMobileOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      alert("Enter valid mobile");
      return;
    }

    try {
      setOtpLoading("mobile-send");
      await postJson("/api/auth/send-whatsapp-otp", { mobile });
      setMobileOtpSent(true);
      setOtpMessage("Mobile OTP sent on WhatsApp");
    } catch (error: any) {
      alert(error.message || "Could not send mobile OTP");
    } finally {
      setOtpLoading("");
    }
  };

  const verifyMobileOtp = async () => {
    if (!mobileOtp.trim()) {
      alert("Enter mobile OTP");
      return;
    }

    try {
      setOtpLoading("mobile-verify");
      await postJson("/api/auth/verify-whatsapp-otp", {
        mobile,
        otp: mobileOtp,
        fullName,
        email,
      });
      setMobileVerified(true);
      setOtpMessage("Mobile verified");
    } catch (error: any) {
      alert(error.message || "Could not verify mobile OTP");
    } finally {
      setOtpLoading("");
    }
  };

  const sendEmailOtp = async () => {
    if (!mobileVerified) {
      alert("Verify mobile first");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Enter valid email");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      alert("Enter valid mobile first");
      return;
    }

    try {
      setOtpLoading("email-send");
      await postJson("/api/auth/send-email-otp", { email, mobile });
      setEmailOtpSent(true);
      setOtpMessage("Email OTP sent");
    } catch (error: any) {
      alert(error.message || "Could not send email OTP");
    } finally {
      setOtpLoading("");
    }
  };

  const verifyEmailOtp = async () => {
    if (!emailOtp.trim()) {
      alert("Enter email OTP");
      return;
    }

    try {
      setOtpLoading("email-verify");

      await postJson("/api/auth/verify-email-otp", {
        mobile,
        email,
        otp: emailOtp,
        fullName,
      });

      // ===============================
      // CREATE USER LOGIN
      // ===============================
      const loginRes = await fetch("/api/users/health-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName,
          email,
          mobile,
        }),
      });

      const loginData = await loginRes.json();

      if (!loginData.success) {
        alert(loginData.message);
        return;
      }

      // save login user
      localStorage.setItem(
        "user",
        JSON.stringify({ ...loginData.user, loginTime: Date.now() })
      );

      // update navbar instantly
      window.dispatchEvent(new Event("userLogin"));

      setEmailVerified(true);
      setOtpMessage("Email verified");
    } catch (error: any) {
      alert(error.message || "Could not verify email OTP");
    } finally {
      setOtpLoading("");
    }
  };

  const renderMembers = () => {
    return (
      <div className={styles.step1MembersList}>
        {members.map((m: any, idx: number) => {
          const memberName = m.name || m.relation;

          const lower = memberName.toLowerCase();

          const minAge = lower === "son" || lower === "daughter" ? 0 : 18;

          const ageOptions = Array.from(
            {
              length: 101 - minAge,
            },
            (_, i) => (i + minAge).toString(),
          );

          return (
            <div key={idx} className={styles.step1MemberCard}>
              <Image
                src={getMemberImage(m)}
                alt={memberName}
                className={styles.step1MemberIcon}
              />

              <p>{memberName}</p>

              <div className={styles.step1Dropdown} ref={dropdownRef}>
                <button
                  type="button"
                  className={styles.step1DropdownToggle}
                  onClick={() => {
                    setIsOpenIndex(isOpenIndex === idx ? null : idx);
                  }}
                >
                  {ages[idx] ? `Age: ${ages[idx]}` : "Select Age"}

                  <span
                    className={`${styles.step1Arrow} ${
                      isOpenIndex === idx ? styles.up : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {isOpenIndex === idx && (
                  <ul className={styles.step1DropdownMenu}>
                    {ageOptions.map((age) => (
                      <li
                        key={age}
                        className={
                          ages[idx] === age ? styles.step1SelectedOption : ""
                        }
                        onClick={() => handleAgeSelect(idx, age)}
                      >
                        {age}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ===============================
  // FINAL SUBMIT  (now calls create-quote)
  // ===============================

  const handleSubmit = async () => {
    try {
      for (let i = 0; i < members.length; i++) {
        if (!ages[i]) {
          alert(`Select age for ${members[i].name || members[i].relation}`);
          setStep(1);
          return;
        }
      }

      if (!selectedCity) {
        alert("Select city");
        setStep(2);
        return;
      }

      if (!fullName) {
        alert("Enter name");
        setStep(3);
        return;
      }

      if (!/^[6-9]\d{9}$/.test(mobile)) {
        alert("Enter valid mobile");
        return;
      }

      if (!mobileVerified) {
        alert("Verify mobile number");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert("Enter valid email");
        return;
      }

      if (!emailVerified) {
        alert("Verify email");
        return;
      }

      const resolvedMembers = members.map((m: any, index: number) => {
        const relation = m.relation || m.name;
        const isFemale = [
          "Wife",
          "Mother",
          "Daughter",
          "Grandmother",
          "Mother-in-law",
        ].includes(relation);

        return {
          name: relation === "Self" ? fullName : relation,
          relation,
          age: ages[index],
          gender: m.gender || (isFemale ? "F" : "M"),
          dob: getDOBFromAge(ages[index]),
        };
      });

      const zunoPayload = {
        name: fullName,
        gender: gender,
        dob: getDOBFromAge(ages[0]),
        mobile: mobile,
        email: email,
        city: selectedCity,
        sumInsured: "500000",
        policyTenure: 1,
        medical: medical,
        members: resolvedMembers,
      };

      const hasPED = medical.length > 0 && !medical.includes("None of these");

      const iciciPayload = {
        RequestId:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `icici-${Date.now()}`,
        SumInsured: Number(zunoPayload.sumInsured),
        Tenure: zunoPayload.policyTenure,
        RoomModifier: 1,
        PaymentOption: 0,
        PinCode: Number(getPincodeForCity(selectedCity)),
        TwoHourHospitalization: false,
        IsCombo: false,
        IsOPD: false,
        Jumpstart: false,
        IsPorting: false,
        IsValuePlan: false,
        IsNRI: false,
        HasCIBIL: false,
        ProposerName: fullName,
        ProposerDOB: getIciciDobFromAge(ages[0]),
        Insured: resolvedMembers.map((m) => ({
          InsuredType: Number(m.age) < 18 ? "Kid" : "Adult",
          Name: m.name,
          AddOns: [],
          DateOfBirth: getIciciDobFromAge(m.age),
          Gender: m.gender === "F" ? "Female" : "Male",
          IsPED: hasPED,
          RelationshipWithApplicant: mapIciciRelation(m.relation),
        })),
      };

      // Fetch both insurers so the user can compare — Zuno is no longer
      // gated behind ICICI failing (it used to be a silent fallback-only
      // call, which is why ICICI seemed to "disappear" once Zuno started
      // succeeding).
      const plans: any[] = [];

      try {
        console.log("ZUNO CREATE-QUOTE REQUEST", zunoPayload);
        const response = await fetch("/api/zuno/health/create-quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(zunoPayload),
        });
        const result = await response.json();
        console.log("ZUNO CREATE-QUOTE RESULT", result);

        // Zuno's Retail Health API wraps the real premium data under
        // data.plan_list (one entry per plan tier) — { plan_name,
        // premium_amount, coverage_amount, ... }. The old code read
        // top-level result.premium/plan_name, which never exist on this
        // response, so it silently fell back to ICICI every time.
        const planList = result?.data?.plan_list;
        // coverage_amount on plan_list is an add-on/rider figure, not the
        // total sum insured (Zuno returns "0" there) — the real requested
        // SI lives on the member details / the request itself.
        const memberSumInsured =
          result?.data?.member_details?.[0]?.sum_insured;

        if (response.ok && Array.isArray(planList) && planList.length > 0) {
          plans.push(
            ...planList.map((p: any) => ({
              company: "Zuno General Insurance",
              productVariant: p.plan_name || "Health Plan",
              premium: p.premium_amount ?? 0,
              sumInsured: memberSumInsured || zunoPayload.sumInsured,
              policyTenure: zunoPayload.policyTenure,
              insurer: "zuno",
              quoteId: result?.data?.quote_id,
              raw: { ...result, selectedPlan: p },
            })),
          );
        } else {
          console.log("ZUNO CREATE-QUOTE FAILED", result);
        }
      } catch (zunoError) {
        console.log("ZUNO CREATE-QUOTE THREW", zunoError);
      }

      try {
        console.log("ICICI PREMIUM REQUEST", iciciPayload);
        const response = await fetch("/api/icici/health/premium", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(iciciPayload),
        });
        const result = await response.json();
        console.log("ICICI PREMIUM RESULT", result);

        if (response.ok && result?.Success) {
          plans.push({
            company: "ICICI Lombard",
            productVariant: "Elevate Health",
            premium: result.TotalPremium,
            sumInsured: zunoPayload.sumInsured,
            policyTenure: zunoPayload.policyTenure,
            insurer: "icici",
            transactionId: result.TransactionId,
            raw: result,
          });
        }
      } catch (iciciError) {
        console.log("ICICI PREMIUM THREW", iciciError);
      }

      if (plans.length === 0) {
        alert("Could not fetch a quote right now. Please try again.");
        return;
      }

      router.push({
        pathname: "./health6",
        query: {
          plans: JSON.stringify(plans),
        },
      });
    } catch (error: any) {
      console.log("HEALTH FRONT ERROR", error);
      alert(error.message || "Something went wrong");
    }
  };

  useEffect(() => {
    const cities = City.getCitiesOfCountry("IN") || [];

    setAllCities(cities.map((item) => item.name));
  }, []);

  const searchedCities = citySearch
    ? allCities
        .filter((city) =>
          city.toLowerCase().includes(citySearch.toLowerCase()),
        )
        .slice(0, 50)
    : [];

  return (
    <div>
      <UserDetails />

      <Navbar />

      <div className={styles.wrapper}>
        {step === 1 && (
          <div className={styles.step1Wrapper}>
            <div className={styles.step1BackBtn} onClick={() => router.back()}>
              ‹
            </div>

            <h2>Select Age for Each Member</h2>

            {renderMembers()}

            <button
              className={styles.continueBtn}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className={styles.cityMainWrapper}>
            <div className={styles.cityBack} onClick={() => setStep(1)}>
              ‹
            </div>

            <div className={styles.cityImageBox}>
              <Image
                src={getMemberImage(members[0])}
                alt="User"
                className={styles.cityUserImage}
              />
            </div>

            <div className={styles.cityRight}>
              <h2>Select your city</h2>

              <div className={styles.citySearchBox}>
                <input
                  value={citySearch}
                  placeholder="Search your city"
                  onChange={(e) => setCitySearch(e.target.value)}
                />

                {citySearch ? (
                  <span
                    className={styles.clearCity}
                    onClick={() => {
                      setCitySearch("");
                    }}
                  >
                    ×
                  </span>
                ) : (
                  <FiSearch className={styles.citySearchIcon} />
                )}
              </div>

              <div className={styles.cityList}>
                {(citySearch ? searchedCities : popularCities).map((city) => (
                  <button
                    key={city}
                    className={`${styles.cityChip} ${
                      selectedCity === city ? styles.activeCity : ""
                    }`}
                    onClick={() => {
                      setSelectedCity(city);
                      setCitySearch(city);
                    }}
                  >
                    {city}
                  </button>
                ))}
              </div>

              <button
                className={styles.cityContinueBtn}
                onClick={() => {
                  if (!selectedCity) {
                    alert("Select city");
                    return;
                  }

                  // if already login skip OTP screen
                  if (loggedUser) {
                    setStep(4);
                  } else {
                    setStep(3);
                  }
                }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.detailsMainWrapper}>
            <div className={styles.detailsBack} onClick={() => setStep(2)}>
              {"‹"}
            </div>

            <div className={styles.detailsImageBox}>
              <Image
                src={getMemberImage(members[0])}
                alt="User"
                className={styles.detailsUserImage}
              />
            </div>

            <div className={styles.detailsRight}>
              <h2>Save your progress</h2>

              <p className={styles.detailsSubtitle}>
                Get to plans directly next time you visit us
              </p>

              {/* STEP 1 - NAME MOBILE */}
              {!mobileOtpSent && !mobileVerified && (
                <>
                  <input
                    className={styles.detailsInput}
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />

                  <div className={styles.detailsPhoneGroup}>
                    <span className={styles.detailsCode}>+91</span>

                    <input
                      className={styles.detailsInput}
                      placeholder="Enter mobile number"
                      value={mobile}
                      maxLength={10}
                      inputMode="numeric"
                      onChange={(e) =>
                        setMobile(e.target.value.replace(/\D/g, ""))
                      }
                    />
                  </div>

                  <button
                    className={styles.detailsContinueBtn}
                    onClick={sendMobileOtp}
                    disabled={Boolean(otpLoading)}
                  >
                    {otpLoading === "mobile-send" ? "Sending..." : "Continue"}
                  </button>
                </>
              )}

              {/* STEP 2 MOBILE OTP */}
              {mobileOtpSent && !mobileVerified && (
                <>
                  <input
                    className={styles.detailsInput}
                    placeholder="Enter Mobile OTP"
                    value={mobileOtp}
                    maxLength={6}
                    onChange={(e) =>
                      setMobileOtp(e.target.value.replace(/\D/g, ""))
                    }
                  />

                  <button
                    className={styles.detailsContinueBtn}
                    onClick={verifyMobileOtp}
                  >
                    Verify Mobile
                  </button>
                </>
              )}

              {/* STEP 3 EMAIL */}
              {mobileVerified && !emailOtpSent && !emailVerified && (
                <>
                  <div className={styles.verifiedBox}>✓ Mobile Verified</div>

                  <input
                    className={styles.detailsInput}
                    placeholder="Enter Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <button
                    className={styles.detailsContinueBtn}
                    onClick={sendEmailOtp}
                  >
                    Send Email OTP
                  </button>
                </>
              )}

              {/* STEP 4 EMAIL OTP */}
              {emailOtpSent && !emailVerified && (
                <>
                  <input
                    className={styles.detailsInput}
                    placeholder="Enter Email OTP"
                    value={emailOtp}
                    maxLength={6}
                    onChange={(e) =>
                      setEmailOtp(e.target.value.replace(/\D/g, ""))
                    }
                  />

                  <button
                    className={styles.detailsContinueBtn}
                    onClick={verifyEmailOtp}
                  >
                    Verify Email
                  </button>
                </>
              )}

              {/* FINAL */}
              {mobileVerified && emailVerified && (
                <>
                  <div className={styles.verifiedBox}>✓ Verified</div>

                  <button
                    className={styles.detailsContinueBtn}
                    onClick={() => setStep(4)}
                  >
                    View Plans
                  </button>

                  <p className={styles.detailsTerms}>
                    By clicking on View Plans, you agree to our Privacy Policy &
                    Terms of Use
                  </p>
                </>
              )}

              {otpMessage && (
                <p className={styles.otpMessage}>{otpMessage}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {step === 4 && (
        <div className={styles.medicalOverlay}>
          <div className={styles.medicalBox}>
            <div
              className={styles.medicalBack}
              onClick={() => {
                if (loggedUser) {
                  setStep(2);
                } else {
                  setStep(3);
                }
              }}
            >
              ‹
            </div>

            <div className={styles.medicalAvatarBox}>
              <Image
                src={getMemberImage(members[0])}
                alt="user"
                className={styles.medicalAvatar}
              />
            </div>

            <h2>Medical history</h2>

            <h3>
              Do any member(s) have any existing illnesses for which they take
              regular medication?
            </h3>

            <p>
              That'll make sure their condition is covered and the claim isn't
              rejected.
            </p>

            <div className={styles.diseaseGrid}>
              {diseases.map((item) => (
                <div
                  key={item}
                  className={`${styles.diseaseItem} ${
                    medical.includes(item) ? styles.activeDisease : ""
                  }`}
                  onClick={() => {
                    if (item === "None of these") {
                      setMedical(["None of these"]);
                    } else {
                      setMedical((prev) => {
                        const removeNone = prev.filter(
                          (x) => x !== "None of these",
                        );

                        return removeNone.includes(item)
                          ? removeNone.filter((x) => x !== item)
                          : [...removeNone, item];
                      });
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={medical.includes(item)}
                    readOnly
                  />

                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className={styles.medicalBottom}>
              <button className={styles.finalBtn} onClick={handleSubmit}>
                View plans ›
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Health;