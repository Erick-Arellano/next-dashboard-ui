"use client";

import { useState, useEffect } from "react";
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

type Evaluation = {
  id: number;
  date: Date;
  classId: string;
  class: { name: string };
  teacherId: string;
  teacher: { name: string };
  q1_dinamica: number;
  q2_recursos: number;
  q3_claridad: number;
  q4_escuchado: number;
  q5_participa: number;
  q6_dudas: number;
  q7_puntual: number;
  q8_interes: number;
  q9_material: number;
  q10_relevante: number;
  q11_global: number;
  likedText: string;
  improveText: string;
};

type TeacherItem = {
  id: string;
  name: string;
};

type ClassItem = {
  id: string;
  name: string;
  supervisor: { id: string; name: string } | null;
};

type EvaluationDashboardProps = {
  evaluations: Evaluation[];
  teachers: TeacherItem[];
  classes: ClassItem[];
};

export default function EvaluationDashboard({
  evaluations,
  teachers,
  classes,
}: EvaluationDashboardProps) {
  // State
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [copied, setCopied] = useState(false);

  // Sharing Widget state
  const [shareClassId, setShareClassId] = useState("");
  const [shareLink, setShareLink] = useState("");

  // Update sharing link
  useEffect(() => {
    if (typeof window !== "undefined" && shareClassId) {
      const cls = classes.find((c) => c.id === shareClassId);
      const teacherId = cls?.supervisor?.id || "";
      const origin = window.location.origin;
      setShareLink(`${origin}/evaluations/new?classId=${shareClassId}&teacherId=${teacherId}`);
    } else {
      setShareLink("");
    }
  }, [shareClassId, classes]);

  // Filter evaluations
  const filteredEvals = evaluations.filter((ev) => {
    if (selectedTeacherId && ev.teacherId !== selectedTeacherId) return false;
    if (selectedClassId && ev.classId !== selectedClassId) return false;
    return true;
  });

  // Calculate stats
  const totalCount = filteredEvals.length;
  
  const calculateAverage = (extractor: (e: Evaluation) => number) => {
    if (totalCount === 0) return 0;
    const sum = filteredEvals.reduce((s, e) => s + extractor(e), 0);
    return Number((sum / totalCount).toFixed(1));
  };

  const avgGlobal = calculateAverage((e) => e.q11_global);

  // Recharts Chart Data
  const chartData = [
    { name: "Dinámica", Promedio: calculateAverage((e) => e.q1_dinamica), fill: "#C3E0E5" },
    { name: "Actividades", Promedio: calculateAverage((e) => e.q2_recursos), fill: "#C3E0E5" },
    { name: "Claridad", Promedio: calculateAverage((e) => e.q3_claridad), fill: "#274472" },
    { name: "Escuchado", Promedio: calculateAverage((e) => e.q4_escuchado), fill: "#274472" },
    { name: "Participación", Promedio: calculateAverage((e) => e.q5_participa), fill: "#41729F" },
    { name: "Dudas", Promedio: calculateAverage((e) => e.q6_dudas), fill: "#41729F" },
    { name: "Puntualidad", Promedio: calculateAverage((e) => e.q7_puntual), fill: "#5885AF" },
    { name: "Interés", Promedio: calculateAverage((e) => e.q8_interes), fill: "#5885AF" },
    { name: "Material", Promedio: calculateAverage((e) => e.q9_material), fill: "#8EA8C3" },
    { name: "Relevancia", Promedio: calculateAverage((e) => e.q10_relevante), fill: "#8EA8C3" },
    { name: "Global", Promedio: calculateAverage((e) => e.q11_global), fill: "#1872D9" },
  ];

  // Actions
  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendWhatsApp = () => {
    if (shareLink && shareClassId) {
      const cls = classes.find((c) => c.id === shareClassId);
      const className = cls?.name || shareClassId;
      const teacherName = cls?.supervisor?.name || "su profesor";
      const message = `Hola, por favor ayúdanos respondiendo la evaluación de la clase de *${className}* con el profesor *${teacherName}* en este enlace público: ${shareLink}. ¡Tu opinión es confidencial y muy valiosa! 📚✨`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, "_blank");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Evaluación Docente</h1>
          <p className="text-xs text-gray-400">Analiza las evaluaciones de clase y genera enlaces de compartido</p>
        </div>

        {/* FILTERS */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 outline-none shadow-sm focus:border-vocaliBlue transition"
          >
            <option value="">Todos los Profesores</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 outline-none shadow-sm focus:border-vocaliBlue transition"
          >
            <option value="">Todos los Grupos</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TOP STATS CARDS & SHARING WIDGET */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* STAT 1: TOTAL */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-semibold block">Total de Evaluaciones</span>
            <span className="text-2xl font-bold text-gray-800 block mt-1">{totalCount}</span>
            <span className="text-[10px] text-gray-400 block mt-0.5">Respuestas anónimas registradas</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-vocaliBlue flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801-12c.065.21.1.433.1.664a2.25 2.25 0 0 1-2.25 2.25 2.25 2.25 0 0 1-2.25-2.25c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125H9.75v-3" />
            </svg>
          </div>
        </div>

        {/* STAT 2: SATISFACTION */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-semibold block">Satisfacción Global</span>
            <span className="text-2xl font-bold text-gray-800 block mt-1">
              {totalCount > 0 ? `${avgGlobal} / 10` : "-"}
            </span>
            <span className="text-[10px] text-gray-400 block mt-0.5">Calificación promedio global</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.172-.377.692-.377.864 0l2.082 4.542 4.908.647c.414.055.58.558.275.845l-3.6 3.41 1.01 4.887c.085.413-.353.731-.722.518l-4.298-2.527-4.298 2.527c-.369.213-.807-.105-.722-.518l1.01-4.887-3.6-3.41c-.305-.287-.139-.79.275-.845l4.908-.647 2.082-4.542Z" />
            </svg>
          </div>
        </div>

        {/* SHARING LINK WIDGET */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between gap-3">
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Compartir Evaluación</span>
            <span className="text-[10px] text-gray-400 block mt-0.5">Genera un enlace para alumnos sin acceso</span>
          </div>
          
          <div className="flex gap-2 items-center">
            <select
              value={shareClassId}
              onChange={(e) => setShareClassId(e.target.value)}
              className="flex-1 bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-vocaliBlue transition shadow-inner font-semibold"
            >
              <option value="">Selecciona Grupo</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleCopyLink}
              disabled={!shareLink}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                copied
                  ? "bg-green-500 text-white"
                  : "bg-vocaliBlue hover:bg-blue-600 text-white disabled:opacity-40"
              }`}
            >
              {copied ? "Copiado" : "Copiar"}
            </button>

            <button
              onClick={handleSendWhatsApp}
              disabled={!shareLink}
              className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-40 flex items-center justify-center"
              title="Compartir por WhatsApp"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-3.5 h-3.5 fill-current">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* DETAILED STATS (BAR CHART) */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
        <div className="pb-2 border-b border-gray-50 mb-4">
          <h1 className="text-base font-bold text-gray-800">Desempeño Promedio por Métrica</h1>
          <p className="text-[10px] text-gray-400">Puntuación promedio del 1 al 10 en cada aspecto evaluado</p>
        </div>

        {totalCount === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-gray-400 font-medium">
            No hay evaluaciones registradas con los filtros seleccionados.
          </div>
        ) : (
          <div className="w-full h-80 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={26}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tick={{ fill: "#6b7280", fontSize: 10, fontWeight: 500 }}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 10 }}
                  tickLine={false}
                  domain={[0, 10]}
                  allowDecimals={true}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", borderColor: "#f3f4f6" }}
                  labelClassName="font-bold text-xs text-gray-700"
                  itemStyle={{ fontSize: "11px" }}
                />
                <Bar
                  dataKey="Promedio"
                  radius={[5, 5, 0, 0]}
                  data={chartData}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* QUALITATIVE FEEDBACK (LIKED & IMPROVEMENTS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* LIKED TEXT */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
          <div className="pb-2 border-b border-gray-50">
            <h1 className="text-base font-bold text-green-800">Aspectos más valorados (Lo que gustó)</h1>
            <p className="text-[10px] text-gray-400">Fortalezas detectadas en los comentarios de los alumnos</p>
          </div>

          <div className="flex flex-col gap-3.5 max-h-96 overflow-y-auto pr-1">
            {filteredEvals.filter((ev) => ev.likedText.trim()).length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">Sin comentarios registrados.</p>
            ) : (
              filteredEvals
                .filter((ev) => ev.likedText.trim())
                .map((ev) => (
                  <div key={ev.id} className="bg-green-50/40 p-3 rounded-lg border border-green-50/80 text-xs">
                    <p className="text-green-900 leading-relaxed italic">&ldquo;{ev.likedText}&rdquo;</p>
                    <div className="mt-2 flex items-center justify-between text-[9px] text-gray-400 font-semibold font-mono">
                      <span>Prof: {ev.teacher.name}</span>
                      <span>{ev.class.name}</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* IMPROVE TEXT */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
          <div className="pb-2 border-b border-gray-50">
            <h1 className="text-base font-bold text-amber-800">Sugerencias de mejora (Oportunidades)</h1>
            <p className="text-[10px] text-gray-400">Puntos de atención y retroalimentación para el docente</p>
          </div>

          <div className="flex flex-col gap-3.5 max-h-96 overflow-y-auto pr-1">
            {filteredEvals.filter((ev) => ev.improveText.trim()).length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">Sin comentarios registrados.</p>
            ) : (
              filteredEvals
                .filter((ev) => ev.improveText.trim())
                .map((ev) => (
                  <div key={ev.id} className="bg-amber-50/40 p-3 rounded-lg border border-amber-50/80 text-xs">
                    <p className="text-amber-900 leading-relaxed italic">&ldquo;{ev.improveText}&rdquo;</p>
                    <div className="mt-2 flex items-center justify-between text-[9px] text-gray-400 font-semibold font-mono">
                      <span>Prof: {ev.teacher.name}</span>
                      <span>{ev.class.name}</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
