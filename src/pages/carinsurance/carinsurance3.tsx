// src/pages/carinsurance/carinsurance3.tsx
import { useState, useEffect } from "react";
import styles from "@/styles/pages/carinsurance3.module.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import {
  FaFilter,
  FaVideo,
  FaTrophy,
  FaTimes,
  FaShieldAlt,
  FaRoad,
  FaTools,
  FaOilCan,
  FaKey,
  FaFileInvoiceDollar,
  FaSuitcaseRolling,
  FaAward,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaPencilAlt,
  FaMinus,
  FaPlus,
} from "react-icons/fa";
import { RiArrowRightWideLine } from "react-icons/ri";
import UserDetails from "@/components/ui/UserDetails";
import { useRouter } from "next/router";
import Image from "next/image";
import zunoLogo from "@/assets/insurance/zuno.png";
import sbiLogo from "@/assets/insurance/sbi.png";
import IdvEditDialog from "./IdvEditDialog";
import CkycDialog, { CkycResult } from "./CkycDialog";
import { requoteWithAddons, requoteWithIdv } from "@/lib/zuno4w";

// Confirmed Zuno 4W addon subCoverage names (from the "Motor Addon Bundling" collection)
const ADDON_CATALOG = [
  {
    key: "Zero Depreciation",
    label: "Zero Depreciation",
    description: "Full claim value with no deduction for wear and tear on parts",
    icon: FaShieldAlt,
  },
  {
    key: "Basic Road Assistance",
    label: "Roadside Assistance",
    description: "24x7 emergency support for breakdowns, towing and flat tyres",
    icon: FaRoad,
  },
  {
    key: "Engine Protect",
    label: "Engine Protection",
    description: "Covers engine damage from water ingress, oil leakage or seizure",
    icon: FaTools,
  },
  {
    key: "Consumable Cover",
    label: "Consumables Cover",
    description: "Covers cost of nuts, bolts, engine oil and other consumables",
    icon: FaOilCan,
  },
  {
    key: "Key Replacement",
    label: "Key & Lock Replacement",
    description: "Covers cost of replacing lost or stolen keys and locks",
    icon: FaKey,
  },
  {
    key: "Return To Invoice",
    label: "Return to Invoice",
    description: "Get the full invoice value of your car on total loss or theft",
    icon: FaFileInvoiceDollar,
  },
  {
    key: "Loss of Personal Belongings",
    label: "Personal Belongings Cover",
    description: "Covers personal items lost from inside the vehicle",
    icon: FaSuitcaseRolling,
  },
  {
    key: "Protection of NCB",
    label: "NCB Protection",
    description: "Keep your No Claim Bonus intact even after making a claim",
    icon: FaAward,
  },
];

// Where a Zuno addon and an SBI coverage code are confirmed to be the same
// real cover (by SBI's own field names / officially-listed addon names),
// toggling the shared checkbox updates both insurers together. Codes not
// listed here have no confirmed SBI equivalent yet, so they stay Zuno-only.
const ZUNO_TO_SBI_ADDON_MAP: Record<string, string> = {
  "Zero Depreciation": "C101072",
  "Basic Road Assistance": "C101069",
};

const DEFAULT_VISIBLE_ADDONS = 5;

const sameAddonSet = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|");

const CarInsurance3 = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Real quote data
  const [plan, setPlan] = useState<any>(null);
  const [quoteInput, setQuoteInput] = useState<any>(null);

  // SBI quote — bound in parallel with Zuno's; may be a failure entry
  // ({ insurer: "SBI", success: false, response }) when the master-data
  // matching for SBI isn't resolvable yet for this vehicle.
  const [sbiQuote, setSbiQuote] = useState<any>(null);

  // Original Zuno-quoted IDV, fixed as the baseline for the edit range
  const [defaultIdv, setDefaultIdv] = useState<number | null>(null);
  const [showIdvDialog, setShowIdvDialog] = useState(false);
  const [idvLoading, setIdvLoading] = useState(false);
  const [idvError, setIdvError] = useState<string | null>(null);

  // Whether the initial localStorage read has completed (drives the loading skeleton)
  const [loaded, setLoaded] = useState(false);

  // Addons currently baked into `plan`'s premium vs. the checkbox draft selection
  const [appliedAddons, setAppliedAddons] = useState<string[]>([]);
  const [draftAddons, setDraftAddons] = useState<string[]>([]);
  const [showAllAddons, setShowAllAddons] = useState(false);
  const [addonLoading, setAddonLoading] = useState(false);
  const [addonError, setAddonError] = useState<string | null>(null);
  const [showCoverageDetails, setShowCoverageDetails] = useState(false);
  const [showSbiCoverageDetails, setShowSbiCoverageDetails] = useState(false);

  // CKYC verification — required before SBI's policy can be issued.
  const [showCkycDialog, setShowCkycDialog] = useState(false);
  const [ckycResult, setCkycResult] = useState<CkycResult | null>(null);

  // SBI's own IDV band (never borrowed from Zuno) + addon selection, both
  // re-quoted live against SBI on change (no fake/non-functional toggles).
  const [sbiIdv, setSbiIdv] = useState<number | null>(null);
  const [sbiDefaultIdv, setSbiDefaultIdv] = useState<number | null>(null);
  const [sbiMinIdv, setSbiMinIdv] = useState<number | null>(null);
  const [sbiMaxIdv, setSbiMaxIdv] = useState<number | null>(null);
  const [sbiIdvInput, setSbiIdvInput] = useState("");
  const [sbiIdvLoading, setSbiIdvLoading] = useState(false);
  const [sbiIdvError, setSbiIdvError] = useState<string | null>(null);
  const [showSbiIdvEditor, setShowSbiIdvEditor] = useState(false);

  const [sbiAddonCodes, setSbiAddonCodes] = useState<string[]>([]);
  const [sbiSelectedAddons, setSbiSelectedAddons] = useState<string[]>([]);
  const [sbiDraftAddons, setSbiDraftAddons] = useState<string[]>([]);
  const [sbiAddonLoading, setSbiAddonLoading] = useState(false);
  const [sbiAddonError, setSbiAddonError] = useState<string | null>(null);

  // Sort by (UI + state wired now; with only one insurer live, ordering has
  // nothing to reorder yet, but is ready as soon as multiple plans exist)
  const [sortBy, setSortBy] = useState<
    "premiumLowHigh" | "premiumHighLow" | "idvHighLow" | "idvLowHigh"
  >("premiumLowHigh");
  const [showSortSection, setShowSortSection] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Load the real Zuno quote saved by the View Prices step
  useEffect(() => {
    try {
      const p = localStorage.getItem("selectedQuote");
      const q = localStorage.getItem("carQuoteInput");
      const a = localStorage.getItem("carSelectedAddons");
      const s = localStorage.getItem("selectedQuoteSbi");
      const ck = localStorage.getItem("sbiCkycResult");
      if (ck && ck !== "undefined") setCkycResult(JSON.parse(ck));
      if (p && p !== "undefined") {
        const parsedPlan = JSON.parse(p);
        setPlan(parsedPlan);
      }
      if (q && q !== "undefined") {
        const parsedQuoteInput = JSON.parse(q);
        setQuoteInput(parsedQuoteInput);
        // The "Recommended IDV" reference must stay fixed at the vehicle's
        // original suggested IDV — carQuoteInput is never rewritten by this
        // page, unlike selectedQuote (which gets overwritten with whatever
        // custom IDV the customer last applied).
        setDefaultIdv(Number(parsedQuoteInput.idv));
      }
      if (s && s !== "undefined") {
        const parsedSbi = JSON.parse(s);
        setSbiQuote(parsedSbi);
        if (parsedSbi?.success) {
          const r = parsedSbi.response || {};
          setSbiIdv(r.idv?.user ?? null);
          setSbiDefaultIdv(r.idv?.suggested ?? null);
          setSbiMinIdv(r.idv?.min ?? null);
          setSbiMaxIdv(r.idv?.max ?? null);
          setSbiIdvInput(r.idv?.user != null ? String(Math.round(r.idv.user)) : "");
          // The full addon catalog (for rendering every checkbox), but no
          // addon is pre-selected — the initial quote is base-only, and only
          // becomes "selected" once the customer actually picks it.
          setSbiAddonCodes(r.availableAddonCodes || []);
          const currentlyIncluded = (r.coverages || [])
            .filter((c: any) => c.isAddon)
            .map((c: any) => c.code);
          setSbiSelectedAddons(currentlyIncluded);
          setSbiDraftAddons(currentlyIncluded);
        }
      }
      if (a && a !== "undefined") {
        const parsedAddons = JSON.parse(a);
        if (Array.isArray(parsedAddons)) {
          setAppliedAddons(parsedAddons);
          setDraftAddons(parsedAddons);
        }
      }
    } catch (e) {
      console.log("PLAN LOAD ERROR", e);
    } finally {
      setLoaded(true);
    }
  }, []);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const inr = (n: any) =>
    n == null ? "--" : "₹" + Math.round(Number(n)).toLocaleString("en-IN");

  const toggleDraftAddon = (key: string) => {
    setDraftAddons((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
    // Keep SBI's matching draft selection in sync when this addon is a
    // confirmed shared cover (e.g. Zero Depreciation, Roadside Assistance).
    const sbiCode = ZUNO_TO_SBI_ADDON_MAP[key];
    if (sbiCode && sbiAddonCodes.includes(sbiCode)) {
      setSbiDraftAddons((prev) =>
        prev.includes(sbiCode) ? prev.filter((c) => c !== sbiCode) : [...prev, sbiCode]
      );
    }
  };

  // SBI-only coverage codes with no confirmed Zuno-catalog equivalent —
  // shown as their own cards in the same Addons grid.
  const sbiOnlyAddonCodes = sbiAddonCodes.filter(
    (code) => !Object.values(ZUNO_TO_SBI_ADDON_MAP).includes(code)
  );

  const toggleSbiOnlyDraftAddon = (code: string) => {
    setSbiDraftAddons((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const hasPendingAddonChanges =
    !sameAddonSet(draftAddons, appliedAddons) ||
    (sbiQuote?.success && !sameAddonSet(sbiDraftAddons, sbiSelectedAddons));

  // Updates both insurers together — Zuno via its own requote, SBI via its
  // own quickquote — so one "Update Quote" click keeps both cards in sync.
  const applyAddons = async () => {
    if (!plan || !quoteInput) return;
    setAddonLoading(true);
    setAddonError(null);
    try {
      const zunoUpdate = requoteWithAddons(quoteInput, Number(plan.idv), draftAddons).then(
        (updatedPlan) => {
          setPlan(updatedPlan);
          setAppliedAddons(draftAddons);
          localStorage.setItem("selectedQuote", JSON.stringify(updatedPlan));
          localStorage.setItem("carSelectedAddons", JSON.stringify(draftAddons));
        }
      );

      const sbiUpdate =
        sbiQuote?.success && sbiIdv != null
          ? requoteSbi(
              sbiIdv,
              sbiAddonCodes.filter((c) => !sbiDraftAddons.includes(c))
            ).then(() => setSbiSelectedAddons(sbiDraftAddons))
          : Promise.resolve();

      const results = await Promise.allSettled([zunoUpdate, sbiUpdate]);
      const failed = results.find((r) => r.status === "rejected") as
        | PromiseRejectedResult
        | undefined;
      if (failed) {
        setAddonError(failed.reason?.message || "Some quotes couldn't be updated with these addons");
      }
    } finally {
      setAddonLoading(false);
    }
  };

  const addonLabel = (key: string) =>
    ADDON_CATALOG.find((a) => a.key === key)?.label || key;

  // Only codes we can confidently identify from SBI's own sample field names
  // get a specific label — everything else shows plainly as "Additional
  // Cover" with its real premium rather than a guessed/fake benefit name.
  const SBI_COVERAGE_LABELS: Record<string, string> = {
    C101064: "Own Damage Cover",
    C101065: "Third-Party Liability",
    C101066: "Personal Accident Cover",
    C101069: "Roadside Assistance",
    C101072: "Zero Depreciation Cover",
  };
  const sbiCoverageLabel = (code: string) => SBI_COVERAGE_LABELS[code] || `Additional Cover (${code})`;

  const isCustomIdv =
    plan && defaultIdv != null && Number(plan.idv) !== defaultIdv;

  const applyRecommendedIdv = async () => {
    if (!plan || !quoteInput || defaultIdv == null || !isCustomIdv) return;
    setIdvLoading(true);
    setIdvError(null);
    try {
      const updatedPlan = await requoteWithIdv(
        quoteInput,
        defaultIdv,
        appliedAddons
      );
      setPlan(updatedPlan);
      localStorage.setItem("selectedQuote", JSON.stringify(updatedPlan));

      // Same shared IDV control drives SBI's quote too, not just Zuno's.
      if (sbiQuote?.success) {
        const sbiExcluded = sbiAddonCodes.filter((c) => !sbiSelectedAddons.includes(c));
        setSbiIdvError(null);
        requoteSbi(defaultIdv, sbiExcluded).catch((e: any) =>
          setSbiIdvError(e.message || "SBI couldn't price this IDV")
        );
      }
    } catch (e: any) {
      setIdvError(e.message || "Failed to switch to the recommended IDV");
    } finally {
      setIdvLoading(false);
    }
  };

  const visibleAddons = showAllAddons
    ? ADDON_CATALOG
    : ADDON_CATALOG.slice(0, DEFAULT_VISIBLE_ADDONS);

  // Re-quotes live against SBI's own quickquote endpoint with the given IDV
  // and excluded addon codes — no fake/non-functional toggles, the price
  // shown always reflects what SBI actually computed for that selection.
  const requoteSbi = async (idvOverride: number, excludeAddonCodes: string[]) => {
    const res = await fetch("/api/sbi/4w/quickquote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...quoteInput, overrideIdv: idvOverride, excludeAddonCodes }),
    });
    const data = await res.json();
    const updated = { insurer: "SBI", success: !!data.success, response: data };
    setSbiQuote(updated);
    localStorage.setItem("selectedQuoteSbi", JSON.stringify(updated));
    if (!data.success) {
      throw new Error(
        data.error?.messages?.[0]?.message ||
          data.error?.message ||
          `SBI couldn't price this selection at IDV ${inr(idvOverride)} — it may be outside their allowed IDV range`
      );
    }
    // Keep sbiIdv in sync with whatever IDV SBI actually priced against —
    // every caller (shared IDV dialog, recommended-IDV click, addon apply,
    // SBI's own IDV editor) relies on this being current.
    setSbiIdv(data.idv?.user ?? idvOverride);
    return data;
  };

  const applySbiAddons = async () => {
    if (!quoteInput || sbiIdv == null) return;
    setSbiAddonLoading(true);
    setSbiAddonError(null);
    try {
      const excludeAddonCodes = sbiAddonCodes.filter((c) => !sbiDraftAddons.includes(c));
      await requoteSbi(sbiIdv, excludeAddonCodes);
      setSbiSelectedAddons(sbiDraftAddons);
    } catch (e: any) {
      setSbiAddonError(e.message || "Failed to update the SBI quote with these addons");
    } finally {
      setSbiAddonLoading(false);
    }
  };

  const applySbiIdv = async (newIdv: number) => {
    if (!quoteInput) return;
    if (!newIdv || newIdv <= 0) {
      setSbiIdvError("Enter a valid IDV amount");
      return;
    }
    setSbiIdvLoading(true);
    setSbiIdvError(null);
    try {
      const excludeAddonCodes = sbiAddonCodes.filter((c) => !sbiSelectedAddons.includes(c));
      await requoteSbi(newIdv, excludeAddonCodes);
      setSbiIdv(newIdv);
      setSbiIdvInput(String(newIdv));
      setShowSbiIdvEditor(false);
    } catch (e: any) {
      setSbiIdvError(e.message || "Failed to update the IDV");
    } finally {
      setSbiIdvLoading(false);
    }
  };

  const toggleSbiDraftAddon = (code: string) => {
    setSbiDraftAddons((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const hasSbiPendingAddonChanges = !sameAddonSet(sbiDraftAddons, sbiSelectedAddons);
  const isSbiCustomIdv =
    sbiIdv != null && sbiDefaultIdv != null && sbiIdv !== sbiDefaultIdv;

  return (
    <div>
      <UserDetails />
      <Navbar />

      {isMobile && (
        <div className={styles.mobileHeader}>
          <button className={styles.sidebarToggle} onClick={toggleSidebar}>
            {sidebarOpen ? <FaTimes /> : <FaFilter />}
          </button>
        </div>
      )}

      <div className={styles.container}>
        {isMobile && sidebarOpen && (
          <div className={styles.backdrop} onClick={closeSidebar}></div>
        )}

        <div
          className={`${styles.sidebarWrapper} ${
            isMobile
              ? sidebarOpen
                ? styles.sidebarOpen
                : styles.sidebarClosed
              : ""
          }`}
        >
          {isMobile && (
            <div className={styles.closeSidebar}>
              <button onClick={closeSidebar} className={styles.closeButton}>
                <FaTimes />
              </button>
            </div>
          )}

          {/* Sidebar 1 - Vehicle Info (REAL DATA) */}
          <div className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>Vehicle Info</h3>
            <div className={styles.vehicleDetails}>
              <div className={styles.skoda}>
                <div>
                  <h3>
                    {quoteInput
                      ? `${quoteInput.make} ${quoteInput.model}`
                      : "Your Vehicle"}
                  </h3>
                  <p>
                    {quoteInput
                      ? `${quoteInput.variant || ""}`
                      : ""}
                  </p>
                  <p>
                    {quoteInput
                      ? `${quoteInput.registrationDate?.slice(0, 4) || ""} | ${
                          quoteInput.fuelType || ""
                        }`
                      : ""}
                  </p>
                </div>
                <div>
                  <p>
                    <span
                      className={styles.editCar}
                      onClick={() => router.push("/carinsurance")}
                    >
                      Edit Car
                    </span>
                  </p>
                </div>
              </div>
              <hr />

              <div className={styles.idvCard}>
                <p className={styles.idvCardTitle}>IDV (Car value)</p>

                <div
                  className={`${styles.idvOption} ${
                    isCustomIdv ? styles.idvOptionSelected : ""
                  }`}
                  onClick={() => {
                    if (plan && quoteInput) setShowIdvDialog(true);
                  }}
                >
                  <span
                    className={styles.idvRadio}
                    data-checked={Boolean(isCustomIdv)}
                  />
                  <span className={styles.idvOptionLabel}>Selected IDV</span>
                  <span className={styles.idvOptionValue}>
                    {inr(plan?.idv)}
                  </span>
                  <FaPencilAlt
                    className={styles.idvPencil}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (plan && quoteInput) setShowIdvDialog(true);
                    }}
                  />
                </div>

                <div
                  className={`${styles.idvOption} ${
                    !isCustomIdv ? styles.idvOptionSelected : ""
                  }`}
                  onClick={applyRecommendedIdv}
                >
                  <span
                    className={styles.idvRadio}
                    data-checked={!isCustomIdv}
                  />
                  <span className={styles.idvOptionLabel}>
                    Recommended IDV
                  </span>
                  <span className={styles.idvOptionValue}>
                    {defaultIdv != null ? inr(defaultIdv) : "--"}
                  </span>
                </div>

                {idvLoading && (
                  <p className={styles.idvHint}>Updating IDV...</p>
                )}
                {idvError && <p className={styles.addonError}>{idvError}</p>}
              </div>

              <div className={styles.detailRow}>
                <p>RTO</p>
                <p>
                  {quoteInput?.rtoLocationName || "--"}{" "}
                  <RiArrowRightWideLine className={styles.rightArrow} />
                </p>
              </div>
              <div className={styles.detailRow}>
                <p>Policy Type</p>
                <p>
                  Own Damage{" "}
                  <RiArrowRightWideLine className={styles.rightArrow} />
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar 2 - Addons (real, wired to Zuno's Addon Contract) */}
          <div className={styles.sidebar1}>
            <h3 className={styles.sidebarTitle}>
              <FaFilter className={styles.icon} /> Addons
            </h3>
            <div className={styles.addonGrid}>
              {visibleAddons.map((addon) => {
                const Icon = addon.icon;
                const selected = draftAddons.includes(addon.key);
                return (
                  <button
                    key={addon.key}
                    type="button"
                    className={`${styles.addonCard} ${
                      selected ? styles.addonCardSelected : ""
                    }`}
                    onClick={() => toggleDraftAddon(addon.key)}
                  >
                    <div className={styles.addonCardHeader}>
                      <Icon className={styles.addonIcon} />
                      <span className={styles.addonLabel}>{addon.label}</span>
                      {selected && (
                        <FaCheckCircle className={styles.addonCheck} />
                      )}
                    </div>
                    <p className={styles.addonDescription}>
                      {addon.description}
                    </p>
                  </button>
                );
              })}

              {sbiQuote?.success &&
                sbiOnlyAddonCodes.map((code) => {
                  const selected = sbiDraftAddons.includes(code);
                  return (
                    <button
                      key={code}
                      type="button"
                      className={`${styles.addonCard} ${
                        selected ? styles.addonCardSelected : ""
                      }`}
                      onClick={() => toggleSbiOnlyDraftAddon(code)}
                    >
                      <div className={styles.addonCardHeader}>
                        <span className={styles.addonLabel}>{sbiCoverageLabel(code)}</span>
                        {selected && <FaCheckCircle className={styles.addonCheck} />}
                      </div>
                      <p className={styles.addonDescription}>SBI General Insurance add-on</p>
                    </button>
                  );
                })}
            </div>

            {ADDON_CATALOG.length > DEFAULT_VISIBLE_ADDONS && (
              <p
                className={styles.seeAll}
                onClick={() => setShowAllAddons((prev) => !prev)}
              >
                {showAllAddons ? "See less ▲" : "See all ▼"}
              </p>
            )}

            {addonError && <p className={styles.addonError}>{addonError}</p>}

            {hasPendingAddonChanges && (
              <button
                type="button"
                className={styles.updateQuoteBtn}
                onClick={applyAddons}
                disabled={addonLoading}
              >
                {addonLoading ? "Updating..." : "Update Quote →"}
              </button>
            )}
          </div>


          {/* Sidebar 3 - Sort by */}
          <div className={styles.sidebar1}>
            <div
              className={styles.sortHeader}
              onClick={() => setShowSortSection((prev) => !prev)}
            >
              <h3 className={styles.sidebarTitle}>Sort by</h3>
              {showSortSection ? <FaMinus /> : <FaPlus />}
            </div>

            {showSortSection && (
              <div className={styles.sortOptions}>
                {[
                  { key: "premiumLowHigh", label: "Premium low to high" },
                  { key: "premiumHighLow", label: "Premium high to low" },
                  { key: "idvHighLow", label: "IDV high to low" },
                  { key: "idvLowHigh", label: "IDV low to high" },
                ].map((opt) => (
                  <label key={opt.key} className={styles.sortOption}>
                    <span
                      className={styles.sortRadio}
                      data-checked={sortBy === opt.key}
                      onClick={() => setSortBy(opt.key as typeof sortBy)}
                    />
                    <span onClick={() => setSortBy(opt.key as typeof sortBy)}>
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content — REAL ZUNO PLAN */}
        <div className={styles.mainContent}>
          {!loaded ? (
            <div className={styles.skeletonCard}>
              <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
              <div className={styles.skeletonBlock} />
            </div>
          ) : plan ? (
            <>
              <h2>{sbiQuote?.success ? "2 plans available" : "1 plan available"}</h2>
              <p>Covers damages to your car. Premium includes GST.</p>

              <div className={styles.planCard}>
                <div className={styles.planHeader}>
                  <FaTrophy className={styles.trophy} />
                  Zuno General Insurance
                  <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 500, color: "#5a5959" }}>
                    Own Damage Only
                  </span>
                </div>
                <div className={styles.planDetails}>
                  <div className={styles.logoWrap}>
                    <Image
                      src={zunoLogo}
                      alt="Zuno General Insurance"
                      className={styles.logo}
                    />
                  </div>
                  <div>
                    <div style={{ color: "#5a5959" }}>
                      IDV Cover <strong>{inr(plan.idv)}</strong>
                    </div>
                    <div className={styles.premiumBreakdown}>
                      <span>
                        Own Damage {inr(plan.odPremium ?? plan.netPremium)}
                      </span>
                      {appliedAddons.length > 0 && (
                        <span>Addons {inr(plan.addonPremium)}</span>
                      )}
                      <span>GST {inr(plan.gst)}</span>
                    </div>
                    {appliedAddons.length > 0 && (
                      <div className={styles.addonTags}>
                        {appliedAddons.map((key) => (
                          <span key={key} className={styles.addonTag}>
                            <FaCheckCircle /> {addonLabel(key)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={styles.actions}>
                    <div
                      className={styles.price}
                      onClick={() => {
                        localStorage.setItem("selectedInsurer", "ZUNO");
                        router.push("/cart/carinsurancecart");
                      }}
                    >
                      {inr(plan.grossPremium)} →
                    </div>
                  </div>
                </div>
                <div className={styles.inspectionNote}>
                  <FaVideo className={styles.videoIcon} /> Car video inspection
                  may be required
                </div>
                <div className={styles.cashless}>
                  <div className={styles.coverage}>
                    <span
                      className={styles.coverageToggle}
                      onClick={() => setShowCoverageDetails((prev) => !prev)}
                    >
                      View Coverage{" "}
                      {showCoverageDetails ? (
                        <FaChevronUp />
                      ) : (
                        <FaChevronDown />
                      )}
                    </span>
                  </div>
                </div>

                {showCoverageDetails && (
                  <div className={styles.coverageDetails}>
                    <div className={styles.coverageRow}>
                      <strong>Own Damage Cover</strong>
                      <span>Own Damage Basic</span>
                    </div>
                    {appliedAddons.length > 0 && (
                      <div className={styles.coverageRow}>
                        <strong>Add On Cover</strong>
                        <span>
                          {appliedAddons.map(addonLabel).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {sbiQuote && (
                <div className={styles.planCard}>
                  <div className={styles.planHeader}>
                    <FaTrophy className={styles.trophy} />
                    SBI General Insurance
                    {sbiQuote.success && (
                      <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 500, color: "#5a5959" }}>
                        Comprehensive (OD + TP + PA)
                      </span>
                    )}
                  </div>
                  <div className={styles.planDetails}>
                    <div className={styles.logoBanner}>
                      <Image
                        src={sbiLogo}
                        alt="SBI General Insurance"
                        className={styles.logo}
                      />
                    </div>
                    {sbiQuote.success ? (
                      <>
                        <div>
                          <div style={{ color: "#5a5959" }}>
                            IDV Cover <strong>{inr(sbiIdv)}</strong>
                          </div>
                          {sbiIdvError && (
                            <p className={styles.addonError}>{sbiIdvError}</p>
                          )}
                          <div className={styles.premiumBreakdown}>
                            <span>Own Damage {inr(sbiQuote.response?.odPremium)}</span>
                            <span>Third Party {inr(sbiQuote.response?.tpPremium)}</span>
                            <span>GST {inr(sbiQuote.response?.gst)}</span>
                          </div>
                          {sbiSelectedAddons.length > 0 && (
                            <div className={styles.addonTags}>
                              {sbiSelectedAddons.map((code) => (
                                <span key={code} className={styles.addonTag}>
                                  <FaCheckCircle /> {sbiCoverageLabel(code)}
                                </span>
                              ))}
                            </div>
                          )}
                          {ckycResult && (
                            <div className={styles.addonTags}>
                              <span className={styles.addonTag}>
                                <FaCheckCircle /> KYC Verified
                              </span>
                            </div>
                          )}
                        </div>
                        <div className={styles.actions}>
                          <div
                            className={styles.price}
                            onClick={() => {
                              if (ckycResult) {
                                localStorage.setItem("selectedInsurer", "SBI");
                                router.push("/cart/carinsurancecart");
                              } else {
                                setShowCkycDialog(true);
                              }
                            }}
                          >
                            {inr(sbiQuote.response?.premium)} →
                          </div>
                      
                        </div>

                        
                      </>
                    ) : (
                      <div style={{ color: "#5a5959" }}>
                        SBI quote isn&apos;t available for this vehicle right now.
                      </div>
                    )}
                  </div>

                  {sbiQuote.success && (
                    <>
                      <div className={styles.cardFooter}>
                        <div className={styles.footerLinks}>
                        
                          <span
                            className={styles.footerLink}
                            onClick={() => setShowSbiCoverageDetails((prev) => !prev)}
                          >
                            View Coverage{" "}
                            {showSbiCoverageDetails ? <FaChevronUp /> : <FaChevronDown />}
                          </span>
                        </div>
                      </div>

                      {showSbiCoverageDetails && (
                        <div className={styles.coverageDetails}>
                          {(sbiQuote.response?.coverages || [])
                            .filter((c: any) => c.code)
                            .map((c: any, i: number) => (
                              <div className={styles.coverageRow} key={`${c.code}-${i}`}>
                                <strong>{sbiCoverageLabel(c.code)}</strong>
                                <span>{inr(c.premium)}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <h2>No quote found</h2>
              <p>
                Please go back and search your vehicle to get a quote.
              </p>
              <button
                className={styles.price}
                onClick={() => router.push("/carinsurance")}
              >
                Search vehicle
              </button>
            </>
          )}
        </div>
      </div>
      <Footer />

      {plan && quoteInput && defaultIdv != null && (
        <IdvEditDialog
          open={showIdvDialog}
          defaultIdv={defaultIdv}
          currentIdv={Number(plan.idv)}
          quoteInput={quoteInput}
          addons={appliedAddons}
          sbiMinIdv={sbiQuote?.success ? sbiMinIdv : null}
          sbiMaxIdv={sbiQuote?.success ? sbiMaxIdv : null}
          onClose={() => setShowIdvDialog(false)}
          onApply={(newIdv, updatedPlan) => {
            setPlan(updatedPlan);
            localStorage.setItem("selectedQuote", JSON.stringify(updatedPlan));
            setShowIdvDialog(false);

            // Same shared IDV control drives SBI's quote too, not just Zuno's.
            if (sbiQuote?.success) {
              const sbiExcluded = sbiAddonCodes.filter((c) => !sbiSelectedAddons.includes(c));
              setSbiIdvError(null);
              requoteSbi(newIdv, sbiExcluded).catch((e: any) =>
                setSbiIdvError(e.message || "SBI couldn't price this IDV")
              );
            }
          }}
        />
      )}

      <CkycDialog
        open={showCkycDialog}
        onClose={() => setShowCkycDialog(false)}
        onVerified={(result) => {
          setCkycResult(result);
          localStorage.setItem("sbiCkycResult", JSON.stringify(result));
        }}
      />
    </div>
  );
};

export default CarInsurance3;