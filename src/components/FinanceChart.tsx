"use client";

import { useState } from "react";
import Image from "next/image";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Transaction = {
  id: number;
  amount: number;
  type: string; // INCOME or EXPENSE
  category: string;
  date: string | Date;
  description: string;
};

type FinanceChartProps = {
  transactions: Transaction[];
};

const FinanceChart = ({ transactions = [] }: FinanceChartProps) => {
  // Extract unique years from transactions, default to current year if empty
  const years = Array.from(
    new Set(
      transactions.map((tx) => new Date(tx.date).getFullYear())
    )
  ).sort((a, b) => b - a);

  const currentYear = new Date().getFullYear();
  const defaultYear = years.includes(currentYear) ? currentYear : years[0] || currentYear;

  // Extract unique categories
  const categories = Array.from(
    new Set(transactions.map((tx) => tx.category))
  ).sort();

  // Component states
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");

  // Filter transactions based on dropdown selections
  const filtered = transactions.filter((tx) => {
    const txYear = new Date(tx.date).getFullYear();
    const yearMatches = txYear === selectedYear;
    const categoryMatches = selectedCategory === "Todas" || tx.category === selectedCategory;
    return yearMatches && categoryMatches;
  });

  // Aggregate monthly data
  const monthlyData = [
    { name: "Ene", income: 0, expense: 0, profit: 0 },
    { name: "Feb", income: 0, expense: 0, profit: 0 },
    { name: "Mar", income: 0, expense: 0, profit: 0 },
    { name: "Abr", income: 0, expense: 0, profit: 0 },
    { name: "May", income: 0, expense: 0, profit: 0 },
    { name: "Jun", income: 0, expense: 0, profit: 0 },
    { name: "Jul", income: 0, expense: 0, profit: 0 },
    { name: "Ago", income: 0, expense: 0, profit: 0 },
    { name: "Sep", income: 0, expense: 0, profit: 0 },
    { name: "Oct", income: 0, expense: 0, profit: 0 },
    { name: "Nov", income: 0, expense: 0, profit: 0 },
    { name: "Dic", income: 0, expense: 0, profit: 0 },
  ];

  filtered.forEach((tx) => {
    const month = new Date(tx.date).getMonth(); // 0-11
    if (month >= 0 && month < 12) {
      if (tx.type === "INCOME") {
        monthlyData[month].income += tx.amount;
      } else if (tx.type === "EXPENSE") {
        monthlyData[month].expense += tx.amount;
      }
    }
  });

  // Calculate net profit for each month
  monthlyData.forEach((m) => {
    m.profit = m.income - m.expense;
  });

  // Calculate annual totals for the selected view
  const totalIncome = filtered.reduce(
    (sum, tx) => sum + (tx.type === "INCOME" ? tx.amount : 0),
    0
  );
  const totalExpense = filtered.reduce(
    (sum, tx) => sum + (tx.type === "EXPENSE" ? tx.amount : 0),
    0
  );
  const totalProfit = totalIncome - totalExpense;

  return (
    <div className="bg-white rounded-xl w-full h-full p-4 flex flex-col justify-between shadow-sm border border-gray-100">
      {/* HEADER WITH FILTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-50 mb-4">
        <div>
          <h1 className="text-base font-bold text-gray-800">Historial Financiero</h1>
          <p className="text-[10px] text-gray-400">Balance contable mensual de ingresos vs egresos</p>
        </div>
        
        {/* INTERACTIVE SELECTORS */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Year selector */}
          {years.length > 1 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs p-1.5 border border-gray-200 rounded bg-gray-50 text-gray-700 font-semibold focus:outline-none focus:ring-1 focus:ring-vocaliBlue cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  Año {y}
                </option>
              ))}
            </select>
          )}
          
          {/* Category selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs p-1.5 border border-gray-200 rounded bg-gray-50 text-gray-700 font-semibold focus:outline-none focus:ring-1 focus:ring-vocaliBlue cursor-pointer max-w-[160px]"
          >
            <option value="Todas">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* LINE CHART */}
      <div className="w-full flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="90%">
          <LineChart
            data={monthlyData}
            margin={{
              top: 5,
              right: 20,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis 
              axisLine={false} 
              tick={{ fill: "#9ca3af", fontSize: 10 }} 
              tickLine={false}  
              tickMargin={8}
            />
            <Tooltip
              formatter={(value: any) => [`$${Number(value).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`]}
              contentStyle={{ borderRadius: "8px", borderColor: "#f3f4f6" }}
              itemStyle={{ fontSize: "11px" }}
              labelClassName="font-bold text-xs text-gray-700"
            />
            <Legend
              align="center"
              verticalAlign="top"
              wrapperStyle={{ paddingBottom: "20px" }}
              iconType="circle"
              iconSize={8}
            />
            <Line
              type="monotone"
              dataKey="income"
              name="Ingresos"
              stroke="#1872D9" // Vocali Blue
              strokeWidth={3}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="expense" 
              name="Gastos"
              stroke="#F47A20" // Vocali Orange
              strokeWidth={3}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="profit" 
              name="Ganancia Neta"
              stroke="#10B981" // Emerald Green
              strokeWidth={3}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* FOOTER SUMMARY */}
      <div className="flex flex-wrap items-center justify-between text-xs border-t border-gray-100 pt-3 mt-2 px-2 text-slate-500 font-semibold gap-2">
        <div>
          Ingresos: <span className="font-bold text-[#1872D9]">${totalIncome.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
        </div>
        <div>
          Gastos: <span className="font-bold text-[#F47A20]">${totalExpense.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
        </div>
        <div>
          Ganancia Neta: <span className={`font-bold ${totalProfit >= 0 ? "text-[#10B981]" : "text-red-500"}`}>${totalProfit.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
};

export default FinanceChart;
