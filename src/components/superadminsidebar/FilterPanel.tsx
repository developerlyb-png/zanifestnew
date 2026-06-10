"use client";

import React from "react";
import { LuRadius } from "react-icons/lu";

type FilterType = {
  field: string;
  condition: string;
  value: string;
};

type Props = {
  showFilter: boolean;
  setShowFilter: (val: boolean) => void;
  filters: FilterType[];
  operator: "AND" | "OR";
  updateFilter: (
    index: number,
    key: keyof FilterType,
    value: string
  ) => void;
  addFilter: () => void;
  removeFilter: (index: number) => void;
  clearFilters: () => void;
  setOperator: (val: "AND" | "OR") => void;
};

export default function FilterPanel({
  showFilter,
  setShowFilter,
  filters,
  operator,
  updateFilter,
  addFilter,
  removeFilter,
  clearFilters,
  setOperator,
}: Props) {
  if (!showFilter) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        translate: "306px -485px",
        top: "110%",
        background: "#fff",
        padding: 15,
        borderRadius: 8,
        width: 260,
        boxShadow: "0 5px 20px rgba(0,0,0,0.15)",
        zIndex: 999,
      }}
    >
      <h4 style={{ marginBottom: 10 }}>Filter Contacts</h4>

      {filters.map((f, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          {/* FIELD */}
          <select
            value={f.field}
            onChange={(e) =>
              updateFilter(i, "field", e.target.value)
            }
            style={{ width: "100%", marginBottom: 5 }}
          >
            <option value="">Select Field</option>
            <option value="agentCode">Agent Code</option>
            <option value="status">Status</option>
          </select>

          {/* CONDITION */}
          <select
            value={f.condition}
            onChange={(e) =>
              updateFilter(i, "condition", e.target.value)
            }
            style={{ width: "100%", marginBottom: 5 }}
          >
            <option value="is">is</option>
            <option value="contains">contains</option>
          </select>

          {/* VALUE */}
          <input
            value={f.value}
            placeholder="Enter value"
            onChange={(e) =>
              updateFilter(i, "value", e.target.value)
            }
            style={{ width: "100%", marginBottom: 5 }}
          />

          {filters.length > 1 && (
            <button
              onClick={() => removeFilter(i)}
              style={{
                // background: "rgb(255, 251, 251)",
                border: "none",
                padding: "4px 8px",
                cursor: "pointer",
              }}
            >
              🗑️
            </button>
          )}

          <hr />
        </div>
      ))}

      {/* AND / OR */}
      <select
        value={operator}
        onChange={(e) =>
          setOperator(e.target.value as  "AND" | "OR")
        }
        style={{ width: "100%", marginBottom: 10 }}
      >
        {/* <option value="">Select Operator</option> */}
        <option value="AND">AND</option>
        <option value="OR">OR</option>
      </select>

      {/* ADD FILTER */}
     <button
    onClick={addFilter}
    style={{
      width: 28,
      height: 28,
      background: "#e6f4ea",   // light green bg
      border: "none",
      borderRadius: 4,
      color: "#16a34a",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 18,
      marginBottom:10,
      marginLeft:10,
    }}
    title="Add Filter"
  >
    +
  </button>

      <div>
        <button
          style={{
            background: "#0bdaf5",
            color: "#fff",
            padding: "6px 10px",
            marginRight: 5,
            border: "none",
            borderRadius: 4,
          }}
          onClick={() => setShowFilter(false)}
        >
          Apply
        </button>

        <button
          onClick={clearFilters}
          style={{
            background: "#0bb3f5",
            color: "#fff",
            padding: "6px 10px",
            border: "none",
            borderRadius: 4,
          }}
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}
