"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronDown, FiSearch } from "react-icons/fi";
import styles from "@/styles/components/superadminsidebar/AddPolicyForm.module.css";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  // Whether an empty/"unselect" row is offered. Off for fields that always
  // carry a value (e.g. Tax Rate, which defaults to 18% and was never
  // clearable as a plain <select> either).
  allowClear?: boolean;
}

// Drop-in replacement for a plain <select> that adds a search box to filter
// options — used throughout AddPolicyForm so long/growing option lists
// (insurers, motor makes, agents, branches, ...) stay easy to pick from.
const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select",
  disabled,
  className = "",
  searchPlaceholder = "Search...",
  emptyMessage = "No matches found.",
  allowClear = true,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Only worth searching once there's actually a meaningful list to filter —
  // 4 or fewer options is just as fast to scan by eye.
  const showSearch = options.length > 4;

  useEffect(() => {
    if (open && showSearch) searchInputRef.current?.focus();
  }, [open, showSearch]);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className={styles.searchableSelect} ref={wrapperRef}>
      <button
        type="button"
        className={`${styles.searchableSelectTrigger} ${className}`}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className={selectedLabel ? styles.searchableSelectValue : styles.searchableSelectPlaceholder}
        >
          {selectedLabel || placeholder}
        </span>
        <FiChevronDown
          size={14}
          className={`${styles.searchableSelectChevron} ${open ? styles.searchableSelectChevronOpen : ""}`}
        />
      </button>

      {open && !disabled && (
        <div
          className={styles.searchableSelectPanel}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setSearch("");
            }
          }}
        >
          {showSearch && (
            <div className={styles.searchableSelectSearchRow}>
              <FiSearch size={13} />
              <input
                ref={searchInputRef}
                className={styles.searchableSelectSearchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
              />
            </div>
          )}
          <div className={styles.searchableSelectList}>
            {allowClear && !search && (
              <button
                type="button"
                className={`${styles.searchableSelectOption} ${styles.searchableSelectOptionMuted} ${
                  value === "" ? styles.searchableSelectOptionActive : ""
                }`}
                onClick={() => handleSelect("")}
              >
                {placeholder}
              </button>
            )}
            {filteredOptions.length === 0 ? (
              <div className={styles.searchableSelectEmpty}>{emptyMessage}</div>
            ) : (
              filteredOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={`${styles.searchableSelectOption} ${
                    o.value === value ? styles.searchableSelectOptionActive : ""
                  }`}
                  onClick={() => handleSelect(o.value)}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
