"use client";
import Image from "next/image";
import { PieChart, Pie, ResponsiveContainer } from "recharts";

const Performance = ({ 
  value, 
  title = "Rendimiento Promedio" 
}: { 
  value: number | null; 
  title?: string;
}) => {
  const hasValue = value !== null && !isNaN(value);
  const displayValue = hasValue ? (value > 10 ? (value / 10).toFixed(1) : value.toFixed(1)) : "-";
  const numValue = hasValue ? (value > 10 ? value / 10 : value) : 0;
  
  const chartData = [
    { name: "Rendimiento", value: numValue, fill: "#C3EBFA" },
    { name: "Faltante", value: Math.max(0, 10 - numValue), fill: "#FAE27C" },
  ];

  return (
    <div className="bg-white p-4 rounded-md h-80 relative shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
        <Image src="/moreDark.png" alt="" width={16} height={16} />
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            dataKey="value"
            startAngle={180}
            endAngle={0}
            data={chartData}
            cx="50%"
            cy="55%"
            innerRadius={70}
            outerRadius={90}
            fill="#8884d8"
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-[52%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <h1 className="text-3xl font-bold text-gray-800">{displayValue}</h1>
        <p className="text-xs text-gray-400 font-medium">{hasValue ? "de 10.0 pts" : "Sin evaluar"}</p>
      </div>
      <h2 className="font-semibold text-sm absolute bottom-12 left-0 right-0 m-auto text-center text-gray-600">
        Calificación Acumulada
      </h2>
    </div>
  );
};

export default Performance;
