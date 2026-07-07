"use client";

import Image from "next/image";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
} from "recharts";

type CountChartProps = {
  pagado: number;
  pendiente: number;
  atrasado: number;
};

const CountChart = ({ pagado, pendiente, atrasado }: CountChartProps) => {
  const total = pagado + pendiente + atrasado;
  
  // Prevent division by zero
  const getPercentage = (value: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const data = [
    {
      name: "Total",
      count: total,
      fill: "white",
    },
    {
      name: "Atrasados",
      count: atrasado,
      fill: "#EF4444", // Red
    },
    {
      name: "Pendientes",
      count: pendiente,
      fill: "#FAE27C", // Soft Yellow
    },
    {
      name: "Pagados",
      count: pagado,
      fill: "#1872D9", // Vocali Blue
    },
  ];

  return (
    <div className="bg-white rounded-xl w-full h-full p-4 flex flex-col justify-between shadow-sm border border-gray-100">
      {/* TITLE */}
      <div className="flex justify-between items-center pb-2 border-b border-gray-50">
        <div>
          <h1 className="text-base font-bold text-gray-800">Estatus de Cobros</h1>
          <p className="text-[10px] text-gray-400">Estado de fichas en el ciclo</p>
        </div>
      </div>
      
      {/* CHART */}
      <div className="relative w-full h-[60%] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="50%"
            outerRadius="100%"
            barSize={18}
            data={data}
          >
            <RadialBar background dataKey="count" cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-gray-800 leading-none">{total}</span>
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">Fichas</span>
        </div>
      </div>

      {/* BOTTOM LEGENDS */}
      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-2.5 h-2.5 bg-vocaliBlue rounded-full mb-1" />
          <span className="text-xs font-bold text-gray-700">{pagado}</span>
          <span className="text-[9px] text-gray-400 font-medium">Pagados ({getPercentage(pagado)}%)</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="w-2.5 h-2.5 bg-[#FAE27C] rounded-full mb-1" />
          <span className="text-xs font-bold text-gray-700">{pendiente}</span>
          <span className="text-[9px] text-gray-400 font-medium">Pend. ({getPercentage(pendiente)}%)</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full mb-1" />
          <span className="text-xs font-bold text-gray-700">{atrasado}</span>
          <span className="text-[9px] text-gray-400 font-medium">Atras. ({getPercentage(atrasado)}%)</span>
        </div>
      </div>
    </div>
  );
};

export default CountChart;
