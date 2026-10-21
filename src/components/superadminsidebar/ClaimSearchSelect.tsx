"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/components/superadminsidebar/Claims.module.css";
import { FiSearch, FiChevronDown, FiChevronUp, FiX } from "react-icons/fi";

export interface SelectOption {
  value: string;
  label: string;
  sub?: string;
  right?: string;
  rightSub?: string;
  data?: any;
}

interface Props {
  placeholder: string;
  /** Text shown for the currently selected value ("" = nothing selected). */
  valueLabel: string;
  onSelect: (option: SelectOption) => void;
  onClear?: () => void;
  error?: boolean;
  /** Static list filtered locally — the closed box looks like a dropdown. */
  options?: SelectOption[];
  /** Remote search — the box itself is the search input (typeahead). */
  onSearch?: (query: string) => Promise<SelectOption[]>;
}

export default function SearchableSelect({
  placeholder,
  valueLabel,
  onSelect,
  onClear,
  error,
  options,
  onSearch,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remoteOptions, setRemoteOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced remote search — also fires with "" on open so the list isn't
  // empty before the user has typed anything.
  useEffect(() => {
    if (!open || !onSearch) return;
    setLoading(true);
    const t = setTimeout(() => {
      onSearch(query)
        .then(setRemoteOptions)
        .catch(() => setRemoteOptions([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  const visible: SelectOption[] = onSearch
    ? remoteOptions
    : (options || []).filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  const choose = (o: SelectOption) => {
    onSelect(o);
    setOpen(false);
    setQuery("");
  };

  const errorCls = error ? styles.errorInput : "";

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {onSearch ? (
        <div className={`${styles.ssBox} ${open ? styles.ssBoxOpen : ""} ${errorCls}`}>
          <span className={styles.ssIcon}>
            <FiSearch />
          </span>
          <input
            className={styles.ssInput}
            placeholder={placeholder}
            value={open ? query : valueLabel}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
          />
          {valueLabel && onClear && (
            <button
              type="button"
              className={styles.ssClear}
              onClick={() => {
                onClear();
                setQuery("");
              }}
              aria-label="Clear"
            >
              <FiX />
            </button>
          )}
        </div>
      ) : (
        <div
          className={`${styles.ssBox} ${open ? styles.ssBoxOpen : ""} ${errorCls}`}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={`${styles.ssGrow} ${valueLabel ? "" : styles.ssPlaceholder}`}>
            {valueLabel || placeholder}
          </span>
          <span className={styles.ssIcon}>{open ? <FiChevronUp /> : <FiChevronDown />}</span>
        </div>
      )}

      {open && (
        <div className={styles.ssPanel}>
          {!onSearch && (
            <div className={styles.ssSearchRow}>
              <div className={styles.ssSearch}>
                <FiSearch />
                <input
                  autoFocus
                  className={styles.ssInput}
                  placeholder="Search options..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          )}
          {loading && visible.length === 0 ? (
            <div className={styles.ssEmpty}>Searching...</div>
          ) : visible.length === 0 ? (
            <div className={styles.ssEmpty}>No results found</div>
          ) : (
            visible.map((o) => (
              <button key={o.value} type="button" className={styles.ssOption} onClick={() => choose(o)}>
                <span>
                  <div className={styles.ssOptionMain}>{o.label}</div>
                  {o.sub && <div className={styles.ssOptionSub}>{o.sub}</div>}
                </span>
                {(o.right || o.rightSub) && (
                  <span className={styles.ssOptionRight}>
                    <div>{o.right}</div>
                    {o.rightSub && <div className={styles.ssOptionRightSub}>{o.rightSub}</div>}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
