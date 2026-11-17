import React from "react";
import styles from "@/styles/components/cart/ShriramCheckoutForm.module.css";

// Day / Month / Year dropdowns — picking a birth year is one click, unlike a
// native calendar that has to be paged back month by month. Value is
// yyyy-mm-dd (or "" until all three parts are chosen).

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Props {
  value: string;
  onChange: (iso: string) => void;
  minYear: number;
  maxYear: number;
  ariaLabel?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const daysIn = (y: number, m: number) => new Date(y || 2000, m, 0).getDate();

export default function DateSelect({ value, onChange, minYear, maxYear, ariaLabel }: Props) {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const [y, mo, d] = m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];

  // Partial picks are held locally until a full date exists
  const [draft, setDraft] = React.useState({ y, mo, d });
  React.useEffect(() => {
    if (m) setDraft({ y, mo, d });
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (part: Partial<typeof draft>) => {
    const next = { ...draft, ...part };
    // Keep the day valid when month/year changes (e.g. 31 → Feb)
    if (next.y && next.mo && next.d > daysIn(next.y, next.mo)) next.d = daysIn(next.y, next.mo);
    setDraft(next);
    onChange(next.y && next.mo && next.d ? `${next.y}-${pad(next.mo)}-${pad(next.d)}` : "");
  };

  const years: number[] = [];
  for (let yr = maxYear; yr >= minYear; yr--) years.push(yr);
  const dayCount = draft.mo ? daysIn(draft.y, draft.mo) : 31;

  return (
    <div className={styles.dateRow} role="group" aria-label={ariaLabel}>
      <select className={styles.select} value={draft.d || ""} onChange={(e) => update({ d: +e.target.value })} aria-label="Day">
        <option value="">Day</option>
        {Array.from({ length: dayCount }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <select className={styles.select} value={draft.mo || ""} onChange={(e) => update({ mo: +e.target.value })} aria-label="Month">
        <option value="">Month</option>
        {MONTHS.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </select>
      <select className={styles.select} value={draft.y || ""} onChange={(e) => update({ y: +e.target.value })} aria-label="Year">
        <option value="">Year</option>
        {years.map((yr) => (
          <option key={yr} value={yr}>
            {yr}
          </option>
        ))}
      </select>
    </div>
  );
}
