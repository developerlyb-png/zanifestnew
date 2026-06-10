
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", price: 30 },
  { month: "Feb", price: 40 },
  { month: "Mar", price: 40 },
  { month: "Apr", price: 50 },
  { month: "May", price: 35 },
  { month: "Jun", price: 55 },
  { month: "Jul", price: 65 },
  { month: "Aug", price: 70 },
];

const SalesChart = () => {
  return (
    <div style={{ width: "100%", height: 300, background: "#fff", padding: "1rem", borderRadius: "10px" }}>
      <h3 style={{ marginBottom: "1rem", color: "#111827" }}>Monthly Sales Overview</h3>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis dataKey="price" />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#2dd4bf"
            strokeWidth={4}
            activeDot={{ r: 6 }}
            dot={{ r: 5, fill: "#2dd4bf" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;
