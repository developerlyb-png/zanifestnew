"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import {
  FiUsers,
  FiUserPlus,
  FiMap,
  FiBriefcase,
  FiFileText,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiPercent,
  FiRefreshCw,
  FiArrowRight,
  FiPlus,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiMinusCircle,
} from "react-icons/fi";
import s from "@/styles/components/dashboard/DashboardOverview.module.css";
import { businessLineLabel, isTravelPolicy } from "@/utils/policyCategory";

/**
 * recharts' responsive wrapper measures 0 inside this dashboard layout and
 * renders nothing, so (same as AgentPolicyDashboard) we measure the box
 * ourselves and hand the chart an explicit pixel width. A callback ref so the
 * observer re-attaches whenever the box remounts (period switch, empty state).
 */
function useMeasuredWidth() {
  const [width, setWidth] = useState(0);
  const ro = useRef<ResizeObserver | null>(null);
  const ref = useCallback((node: HTMLDivElement | null) => {
    ro.current?.disconnect();
    ro.current = null;
    if (!node) return;
    setWidth(node.clientWidth);
    ro.current = new ResizeObserver(() => setWidth(node.clientWidth));
    ro.current.observe(node);
  }, []);
  return [ref, width] as const;
}

function Measured({ height, className, children }: { height: number; className?: string; children: (width: number) => React.ReactNode }) {
  const [ref, width] = useMeasuredWidth();
  return (
    <div ref={ref} className={className} style={{ width: "100%", height }}>
      {width > 0 && children(width)}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chart palette — one hue for magnitude, status colours reserved for   */
/* policy state (always shown with an icon + label, never colour alone) */
/* ------------------------------------------------------------------ */
const SERIES = "#2a78d6";
const SERIES_SOFT = "#86b6ef";
const GRID = "#e6ebf2";
const AXIS = "#8a93a6";
const STATUS = {
  active: { color: "#0ca30c", label: "Active", icon: FiCheckCircle },
  draft: { color: "#fab219", label: "Draft / Pending", icon: FiClock },
  danger: { color: "#d03b3b", label: "Expired / Cancelled", icon: FiXCircle },
  other: { color: "#a3a8b4", label: "Other", icon: FiMinusCircle },
} as const;
type StatusKey = keyof typeof STATUS;

export const statusTone = (status?: string): StatusKey => {
  const v = (status || "").toLowerCase();
  if (v === "active" || v === "issued") return "active";
  if (v === "draft" || v === "pending") return "draft";
  if (v === "expired" || v === "cancelled") return "danger";
  return "other";
};

type Period = "7d" | "30d" | "90d" | "12m" | "fy" | "all";
const PERIODS: { key: Period; label: string; days?: number }[] = [
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
  { key: "12m", label: "12M", days: 365 },
  // Same window as the Customer Dashboard's "This Year" (Indian FY, 1 Apr – 31 Mar)
  { key: "fy", label: "This FY" },
  { key: "all", label: "All" },
];

/** Indian financial year containing `d`: 1 Apr 00:00 – 31 Mar 23:59:59.999 (local). */
function fyRange(d: Date) {
  const y = d.getMonth() < 3 ? d.getFullYear() - 1 : d.getFullYear();
  return { from: new Date(y, 3, 1), to: new Date(y + 1, 2, 31, 23, 59, 59, 999) };
}

const DAY = 86400000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Business date of a policy: its risk-start date when known (bulk imports
// get a createdAt of the import day, which would pile them all on one bar),
// falling back to when it was entered.
const policyDate = (p: any): Date | null => {
  const raw = p.startDate || p.createdAt;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};
// Gross premium (incl. GST), same figure as the Customer Dashboard's "Total
// Gross Premium" — net premium here made the two pages disagree by ~18%.
const premiumOf = (p: any) => Number(p.grossPremium ?? p.premium ?? 0) || 0;

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const inrCompact = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e7) return `₹${(n / 1e7).toFixed(a >= 1e8 ? 0 : 1)}Cr`;
  if (a >= 1e5) return `₹${(n / 1e5).toFixed(a >= 1e6 ? 0 : 1)}L`;
  if (a >= 1e3) return `₹${(n / 1e3).toFixed(a >= 1e4 ? 0 : 1)}K`;
  return `₹${Math.round(n)}`;
};

interface Bucket {
  key: string;
  label: string;
  start: number;
  end: number;
  premium: number;
  policies: number;
}

/** Trend buckets sized to the period: daily for ≤30d, weekly for 90d, monthly beyond. */
// Hard ceiling so no data — however odd — can make the chart render
// thousands of points.
const MAX_BUCKETS = 240;
// Must match RENEWAL_WINDOW_DAYS in src/pages/api/admin/policyrenewals.ts
const RENEWAL_WINDOW_DAYS = 90;
const monthsBetween = (a: Date, b: Date) =>
  (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());

/** A policy date worth plotting: year 2000 up to 2 years ahead. Anything else is a data-entry typo. */
function isPlausibleDate(d: Date, now: Date) {
  const y = d.getFullYear();
  return y >= 2000 && y <= now.getFullYear() + 2;
}

function buildBuckets(period: Period, from: Date, to: Date): Bucket[] {
  const out: Bucket[] = [];
  if (period === "7d" || period === "30d") {
    for (let t = startOfDay(from).getTime(); t <= to.getTime(); t += DAY) {
      const d = new Date(t);
      out.push({
        key: String(t),
        label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        start: t,
        end: t + DAY,
        premium: 0,
        policies: 0,
      });
    }
  } else if (period === "90d") {
    for (let t = startOfDay(from).getTime(); t <= to.getTime(); t += 7 * DAY) {
      const d = new Date(t);
      out.push({
        key: String(t),
        label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        start: t,
        end: t + 7 * DAY,
        premium: 0,
        policies: 0,
      });
    }
  } else if (monthsBetween(from, to) > 36) {
    // Long "All" ranges: one bucket per year keeps the chart readable.
    for (let y = from.getFullYear(); y <= to.getFullYear() && out.length < MAX_BUCKETS; y++) {
      out.push({
        key: String(y),
        label: String(y),
        start: new Date(y, 0, 1).getTime(),
        end: new Date(y + 1, 0, 1).getTime(),
        premium: 0,
        policies: 0,
      });
    }
  } else {
    let d = new Date(from.getFullYear(), from.getMonth(), 1);
    while (d <= to && out.length < MAX_BUCKETS) {
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      out.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        start: d.getTime(),
        end: next.getTime(),
        premium: 0,
        policies: 0,
      });
      d = next;
    }
  }
  return out;
}

function Delta({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null) return <span className={s.deltaMuted}>All-time</span>;
  if (previous === 0) {
    return <span className={s.deltaMuted}>{current > 0 ? "New this period" : "No change"}</span>;
  }
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  const Icon = up ? FiTrendingUp : FiTrendingDown;
  return (
    <span className={up ? s.deltaUp : s.deltaDown}>
      <Icon size={12} /> {up ? "+" : ""}
      {pct.toFixed(Math.abs(pct) < 10 ? 1 : 0)}%<span className={s.deltaMuted}> vs prev.</span>
    </span>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className={s.tooltip}>
      <div className={s.tooltipTitle}>{row.label ?? label}</div>
      {"premium" in row && (
        <div className={s.tooltipRow}>
          <span className={s.tooltipSwatch} style={{ background: SERIES }} />
          <span className={s.tooltipKey}>Premium</span>
          <span className={s.tooltipVal}>{inr(row.premium)}</span>
        </div>
      )}
      {"policies" in row && (
        <div className={s.tooltipRow}>
          <span className={s.tooltipSwatch} style={{ background: "transparent" }} />
          <span className={s.tooltipKey}>Policies</span>
          <span className={s.tooltipVal}>{row.policies}</span>
        </div>
      )}
      {"share" in row && (
        <div className={s.tooltipRow}>
          <span className={s.tooltipSwatch} style={{ background: "transparent" }} />
          <span className={s.tooltipKey}>Share</span>
          <span className={s.tooltipVal}>{row.share}%</span>
        </div>
      )}
    </div>
  );
}

/** Horizontal ranked bars — top N + "Other", one hue (it's magnitude, not identity). */
function RankedBars({ rows, empty }: { rows: { label: string; premium: number; policies: number; share: number }[]; empty: string }) {
  if (!rows.length) return <p className={s.empty}>{empty}</p>;
  return (
    <Measured height={Math.max(160, rows.length * 38)}>
      {(w) => (
        <BarChart width={w} height={Math.max(160, rows.length * 38)} data={rows} layout="vertical" margin={{ top: 0, right: 56, bottom: 0, left: 0 }} barCategoryGap={8}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={130}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#4b5568", fontSize: 12 }}
            tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 17) + "…" : v)}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(42,120,214,0.06)" }} />
          <Bar
            dataKey="premium"
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
            isAnimationActive={false}
            label={{ position: "right", fill: "#4b5568", fontSize: 11.5, formatter: (v: any) => inrCompact(Number(v)) }}
          >
            {rows.map((r) => (
              <Cell key={r.label} fill={r.label === "Other" ? SERIES_SOFT : SERIES} />
            ))}
          </Bar>
        </BarChart>
      )}
    </Measured>
  );
}

function rankBy(policies: any[], field: (p: any) => string, top = 6) {
  const map = new Map<string, { premium: number; policies: number }>();
  let total = 0;
  for (const p of policies) {
    const k = (field(p) || "").trim() || "Unspecified";
    const cur = map.get(k) || { premium: 0, policies: 0 };
    cur.premium += premiumOf(p);
    cur.policies += 1;
    total += premiumOf(p);
    map.set(k, cur);
  }
  const sorted = Array.from(map.entries())
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.premium - a.premium);
  const head = sorted.slice(0, top);
  const tail = sorted.slice(top);
  if (tail.length) {
    head.push({
      label: "Other",
      premium: tail.reduce((a, b) => a + b.premium, 0),
      policies: tail.reduce((a, b) => a + b.policies, 0),
    });
  }
  return head.map((r) => ({ ...r, share: total ? Math.round((r.premium / total) * 100) : 0 }));
}

export interface TeamCounts {
  admins: number;
  stateManagers: number;
  districtManagers: number;
  agents: number;
}

export default function DashboardOverview({
  policies,
  team,
  userName,
  onNavigate,
}: {
  policies: any[];
  /** Omit to hide the team row (e.g. staff users without org-wide access). */
  team?: TeamCounts;
  userName?: string;
  onNavigate: (section: string) => void;
}) {
  const [period, setPeriod] = useState<Period>("30d");

  const data = useMemo(() => {
    const now = new Date();
    const cfg = PERIODS.find((p) => p.key === period)!;

    const dated = policies
      .map((p) => ({ p, d: policyDate(p) }))
      .filter((x): x is { p: any; d: Date } => !!x.d);

    let start: Date;
    let end: Date = now;
    let prevStart: Date | null = null;
    if (period === "fy") {
      // Includes policies whose cover starts later in the FY, exactly like
      // the Customer Dashboard's "This Year".
      ({ from: start, to: end } = fyRange(now));
      prevStart = new Date(start.getFullYear() - 1, 3, 1);
    } else if (cfg.days) {
      start = period === "12m"
        ? new Date(now.getFullYear(), now.getMonth() - 11, 1)
        : startOfDay(new Date(now.getTime() - (cfg.days - 1) * DAY));
      prevStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
    } else {
      // "All" means every policy — including ones whose start date is still
      // in the future (advance bookings), which the old `<= now` cut dropped.
      // The chart's time axis only spans *plausible* dates. One typo'd date
      // on live (e.g. year 0026 or 2206) used to stretch it to thousands of
      // monthly buckets and crash the page ("Maximum call stack size
      // exceeded"). Such policies still count in every total below — they
      // just can't widen the chart.
      const plausible = dated.filter((x) => isPlausibleDate(x.d, now));
      const earliest = plausible.reduce((m, x) => (x.d < m ? x.d : m), now);
      const latest = plausible.reduce((m, x) => (x.d > m ? x.d : m), now);
      start = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
      end = latest;
    }

    const current =
      period === "all" ? policies : dated.filter((x) => x.d >= start && x.d <= end).map((x) => x.p);
    const previous = prevStart ? dated.filter((x) => x.d >= prevStart! && x.d < start).map((x) => x.p) : null;

    const sum = (list: any[], f: (p: any) => number) => list.reduce((a, p) => a + f(p), 0);
    const kpi = (list: any[]) => {
      const premium = sum(list, premiumOf);
      return {
        premium,
        policies: list.length,
        avg: list.length ? premium / list.length : 0,
        commission: sum(list, (p) => Number(p.commissionAmount) || 0),
      };
    };

    const buckets = buildBuckets(period, start, end);
    for (const x of dated) {
      if (x.d < start || x.d > end) continue;
      const t = x.d.getTime();
      const b = buckets.find((bk) => t >= bk.start && t < bk.end);
      if (b) {
        b.premium += premiumOf(x.p);
        b.policies += 1;
      }
    }

    const statusCounts: Record<StatusKey, number> = { active: 0, draft: 0, danger: 0, other: 0 };
    current.forEach((p) => (statusCounts[statusTone(p.status)] += 1));

    // Same rule as the Policy Renewals page (api/admin/policyrenewals.ts):
    // every policy whose end date is on or before today + 90 days — that
    // includes already-expired ones not yet renewed (overdue). The card used
    // to look only at the next 30 days and skip overdue, so it showed 0 while
    // the Renewals page listed many. Independent of the period picker.
    // Implausible end dates (Excel-serial years like 46513) are ignored.
    const today = startOfDay(now).getTime();
    const renewals = policies
      .filter((p) => p.endDate && !isTravelPolicy(p)) // travel covers aren't renewed
      .map((p) => ({ p, end: new Date(p.endDate).getTime() }))
      .filter((x) => !isNaN(x.end) && isPlausibleDate(new Date(x.end), now) && x.end <= today + RENEWAL_WINDOW_DAYS * DAY)
      .sort((a, b) => a.end - b.end);
    const overdue = renewals.filter((x) => x.end < today);
    const upcoming = renewals.filter((x) => x.end >= today);

    return {
      cur: kpi(current),
      prev: previous ? kpi(previous) : null,
      buckets,
      statusCounts,
      statusTotal: current.length,
      lob: rankBy(current, (p) => businessLineLabel(p)),
      insurers: rankBy(current, (p) => p.insurer, 5),
      renewals,
      renewalPremium: renewals.reduce((a, x) => a + premiumOf(x.p), 0),
      renewalsOverdue: overdue.length,
      renewalsUpcoming: upcoming,
    };
  }, [policies, period]);

  const recent = policies.slice(0, 6);
  const periodLabel = {
    "7d": "last 7 days",
    "30d": "last 30 days",
    "90d": "last 90 days",
    "12m": "last 12 months",
    fy: "this financial year",
    all: "all time",
  }[period];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const kpis = [
    {
      label: "Gross Premium",
      value: inr(data.cur.premium),
      icon: FiDollarSign,
      tint: "blue",
      cur: data.cur.premium,
      prev: data.prev?.premium ?? null,
    },
    {
      label: "Policies Issued",
      value: data.cur.policies.toLocaleString("en-IN"),
      icon: FiFileText,
      tint: "teal",
      cur: data.cur.policies,
      prev: data.prev?.policies ?? null,
    },
    {
      label: "Avg. Ticket Size",
      value: inr(data.cur.avg),
      icon: FiPercent,
      tint: "violet",
      cur: data.cur.avg,
      prev: data.prev?.avg ?? null,
    },
    {
      label: "Commission Earned",
      value: inr(data.cur.commission),
      icon: FiTrendingUp,
      tint: "amber",
      cur: data.cur.commission,
      prev: data.prev?.commission ?? null,
    },
  ];

  const teamCards = team
    ? [
        { label: "Admins", value: team.admins, sub: "Admin accounts", icon: FiUsers, tint: "blue" },
        { label: "State Managers", value: team.stateManagers, sub: "Regional heads", icon: FiMap, tint: "teal" },
        { label: "District Managers", value: team.districtManagers, sub: "Local heads", icon: FiBriefcase, tint: "amber" },
        { label: "Agents", value: team.agents, sub: "Field agents / POSP", icon: FiUserPlus, tint: "violet" },
      ]
    : [];

  return (
    <div className={s.root}>
      {/* ---------- header + period filter ---------- */}
      <div className={s.topBar}>
        <div>
          <h1 className={s.hello}>
            {greet}
            {userName ? `, ${userName}` : ""} 👋
          </h1>
          <p className={s.helloSub}>Here’s how your insurance business is doing — {periodLabel}.</p>
        </div>
        <div className={s.topActions}>
          <div className={s.segmented} role="tablist" aria-label="Time period">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                role="tab"
                aria-selected={period === p.key}
                className={period === p.key ? s.segActive : s.seg}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button type="button" className={s.primaryBtn} onClick={() => onNavigate("policyDashboard")}>
            <FiPlus size={15} /> Add Policy
          </button>
        </div>
      </div>

      {/* ---------- sales KPIs ---------- */}
      <div className={s.kpiGrid}>
        {kpis.map((k) => (
          <div key={k.label} className={s.kpiCard}>
            <div className={s.kpiHead}>
              <span className={`${s.iconChip} ${s[`tint_${k.tint}`]}`}>
                <k.icon size={16} />
              </span>
              <span className={s.kpiLabel}>{k.label}</span>
            </div>
            <div className={s.kpiValue}>{k.value}</div>
            <div className={s.kpiFoot}>
              <Delta current={k.cur} previous={k.prev} />
            </div>
          </div>
        ))}

        <button type="button" className={`${s.kpiCard} ${s.kpiRenewal}`} onClick={() => onNavigate("policyRenewals")}>
          <div className={s.kpiHead}>
            <span className={`${s.iconChip} ${s.tint_white}`}>
              <FiRefreshCw size={16} />
            </span>
            <span className={s.kpiLabelLight}>Renewals Due</span>
          </div>
          <div className={s.kpiValueLight}>{data.renewals.length}</div>
          <div className={s.kpiFootLight}>
            {data.renewalsUpcoming.length} due in {RENEWAL_WINDOW_DAYS}d · {data.renewalsOverdue} overdue ·{" "}
            {inrCompact(data.renewalPremium)} <FiArrowRight size={12} />
          </div>
        </button>
      </div>

      {/* ---------- team ---------- */}
      {team && (
        <div className={s.teamGrid}>
          {teamCards.map((t) => (
            <div key={t.label} className={s.teamCard}>
              <span className={`${s.iconChipLg} ${s[`tint_${t.tint}`]}`}>
                <t.icon size={18} />
              </span>
              <div>
                <div className={s.teamValue}>{t.value.toLocaleString("en-IN")}</div>
                <div className={s.teamLabel}>{t.label}</div>
                <div className={s.teamSub}>{t.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------- trend + status ---------- */}
      <div className={s.row2}>
        <section className={s.panel}>
          <div className={s.panelHead}>
            <div>
              <h3 className={s.panelTitle}>Premium Trend</h3>
              <p className={s.panelSub}>Premium written per{" "}
                {period === "7d" || period === "30d"
                  ? "day"
                  : period === "90d"
                    ? "week"
                    : data.buckets[0]?.key.length === 4
                      ? "year"
                      : "month"}</p>
            </div>
            <div className={s.panelStat}>
              <span className={s.panelStatValue}>{inrCompact(data.cur.premium)}</span>
              <span className={s.panelStatLabel}>{data.cur.policies} policies</span>
            </div>
          </div>
          {data.cur.policies === 0 ? (
            <p className={s.empty}>No policies in this period.</p>
          ) : (
            <Measured height={280}>
              {(w) => (
                <AreaChart width={w} height={280} data={data.buckets} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={SERIES} stopOpacity={0.24} />
                      <stop offset="100%" stopColor={SERIES} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={{ stroke: GRID }}
                    tick={{ fill: AXIS, fontSize: 11.5 }}
                    minTickGap={18}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: AXIS, fontSize: 11.5 }}
                    tickFormatter={(v) => inrCompact(Number(v))}
                    width={58}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: AXIS, strokeDasharray: "3 3" }} />
                  <Area
                    type="monotone"
                    dataKey="premium"
                    stroke={SERIES}
                    strokeWidth={2}
                    fill="url(#trendFill)"
                    dot={false}
                    activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2, fill: SERIES }}
                  />
                </AreaChart>
              )}
            </Measured>
          )}
        </section>

        <section className={s.panel}>
          <div className={s.panelHead}>
            <div>
              <h3 className={s.panelTitle}>Policy Status</h3>
              <p className={s.panelSub}>{data.statusTotal} policies · {periodLabel}</p>
            </div>
          </div>
          {data.statusTotal === 0 ? (
            <p className={s.empty}>No policies in this period.</p>
          ) : (
            <>
              <div className={s.bigPct}>
                {Math.round((data.statusCounts.active / data.statusTotal) * 100)}%
                <span className={s.bigPctLabel}>active</span>
              </div>
              <div className={s.stackBar} role="img" aria-label="Policy status breakdown">
                {(Object.keys(STATUS) as StatusKey[]).map((k) =>
                  data.statusCounts[k] ? (
                    <span
                      key={k}
                      title={`${STATUS[k].label}: ${data.statusCounts[k]}`}
                      style={{ flexGrow: data.statusCounts[k], background: STATUS[k].color }}
                    />
                  ) : null
                )}
              </div>
              <ul className={s.statusList}>
                {(Object.keys(STATUS) as StatusKey[]).map((k) => {
                  const Icon = STATUS[k].icon;
                  const n = data.statusCounts[k];
                  return (
                    <li key={k}>
                      <Icon size={14} color={STATUS[k].color} />
                      <span className={s.statusName}>{STATUS[k].label}</span>
                      <span className={s.statusCount}>{n}</span>
                      <span className={s.statusPct}>{Math.round((n / data.statusTotal) * 100)}%</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </div>

      {/* ---------- business mix ---------- */}
      <div className={s.row3}>
        <section className={s.panel}>
          <div className={s.panelHead}>
            <div>
              <h3 className={s.panelTitle}>Premium by Line of Business</h3>
              <p className={s.panelSub}>Where your premium comes from</p>
            </div>
          </div>
          <RankedBars rows={data.lob} empty="No policies in this period." />
        </section>

        <section className={s.panel}>
          <div className={s.panelHead}>
            <div>
              <h3 className={s.panelTitle}>Top Insurers</h3>
              <p className={s.panelSub}>By premium written</p>
            </div>
          </div>
          <RankedBars rows={data.insurers} empty="No policies in this period." />
        </section>

        <section className={s.panel}>
          <div className={s.panelHead}>
            <div>
              <h3 className={s.panelTitle}>Upcoming Renewals</h3>
              <p className={s.panelSub}>
                Next {RENEWAL_WINDOW_DAYS} days
                {data.renewalsOverdue ? ` · ${data.renewalsOverdue} overdue (see Renewals)` : ""}
              </p>
            </div>
            <button type="button" className={s.linkBtn} onClick={() => onNavigate("policyRenewals")}>
              View all <FiArrowRight size={12} />
            </button>
          </div>
          {data.renewalsUpcoming.length === 0 ? (
            <p className={s.empty}>Nothing expiring in the next {RENEWAL_WINDOW_DAYS} days.</p>
          ) : (
            <ul className={s.renewList}>
              {data.renewalsUpcoming.slice(0, 6).map(({ p, end }) => {
                const days = Math.round((end - startOfDay(new Date()).getTime()) / DAY);
                return (
                  <li key={p._id}>
                    <div className={s.renewMain}>
                      <span className={s.renewName}>{p.customer?.fullName || p.policyNumber || "—"}</span>
                      <span className={s.renewMeta}>
                        {p.insurer || "—"} · {inr(premiumOf(p))}
                      </span>
                    </div>
                    <span className={days <= 7 ? s.daysUrgent : s.days}>{days === 0 ? "Today" : `${days}d`}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* ---------- recent ---------- */}
      <section className={s.panel}>
        <div className={s.panelHead}>
          <div>
            <h3 className={s.panelTitle}>Recent Policies</h3>
            <p className={s.panelSub}>Latest entries across all channels</p>
          </div>
          <button type="button" className={s.linkBtn} onClick={() => onNavigate("policyDashboard")}>
            View all policies <FiArrowRight size={12} />
          </button>
        </div>
        {recent.length === 0 ? (
          <p className={s.empty}>No policies yet.</p>
        ) : (
          <div className={s.tableScroll}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Insured</th>
                  <th>Insurer</th>
                  <th>Line of Business</th>
                  <th className={s.num}>Premium</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => {
                  const tone = statusTone(p.status);
                  const Icon = STATUS[tone].icon;
                  return (
                    <tr key={p._id}>
                      <td>
                        <div className={s.cellName}>{p.customer?.fullName || "—"}</div>
                        {p.policyNumber && <div className={s.cellSub}>{p.policyNumber}</div>}
                      </td>
                      <td>{p.insurer || "—"}</td>
                      <td>{businessLineLabel(p)}</td>
                      <td className={s.num}>{premiumOf(p) ? inr(premiumOf(p)) : "—"}</td>
                      <td>
                        <span className={`${s.pill} ${s[`pill_${tone}`]}`}>
                          <Icon size={12} /> {p.status || "—"}
                        </span>
                      </td>
                      <td className={s.cellDate}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-GB") : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
