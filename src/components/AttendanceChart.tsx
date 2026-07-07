"use client";

import Image from "next/image";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type AttendanceChartProps = {
  nuevo: number;
  contactado: number;
  claseMuestra: number;
  listaEspera: number;
  inscrito: number;
  noInteresado: number;
};

const AttendanceChart = ({
  nuevo,
  contactado,
  claseMuestra,
  listaEspera,
  inscrito,
  noInteresado,
}: AttendanceChartProps) => {
  const data = [
    {
      name: "Nuevo",
      Cantidad: nuevo,
      fill: "#D0E8FF", // Light Blue
    },
    {
      name: "Contactado",
      Cantidad: contactado,
      fill: "#1872D9", // Vocali Blue
    },
    {
      name: "Clase Muestra",
      Cantidad: claseMuestra,
      fill: "#FFE6D5", // Soft Orange
    },
    {
      name: "Lista Espera",
      Cantidad: listaEspera,
      fill: "#FAE27C", // Soft Yellow
    },
    {
      name: "Inscrito",
      Cantidad: inscrito,
      fill: "#4ADE80", // Green
    },
    {
      name: "No Interesado",
      Cantidad: noInteresado,
      fill: "#EF4444", // Red
    },
  ];

  return (
    <div className="bg-white rounded-xl p-4 h-full shadow-sm border border-gray-100 flex flex-col justify-between">
      {/* HEADER */}
      <div className="flex justify-between items-center pb-2 border-b border-gray-50 mb-4">
        <div>
          <h1 className="text-base font-bold text-gray-800">Seguimiento de Prospectos (CRM)</h1>
          <p className="text-[10px] text-gray-400">Distribución por estatus de reclutamiento</p>
        </div>
      </div>

      {/* CHART */}
      <div className="w-full flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="95%">
          <BarChart data={data} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: "8px", borderColor: "#f3f4f6" }}
              labelClassName="font-bold text-xs text-gray-700"
              itemStyle={{ fontSize: "11px" }}
            />
            <Bar
              dataKey="Cantidad"
              name="Prospectos"
              radius={[6, 6, 0, 0]}
              // Dynamic fill per bar
              data={data}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttendanceChart;
