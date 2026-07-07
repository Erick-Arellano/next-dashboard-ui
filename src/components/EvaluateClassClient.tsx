"use client";

import { useState } from "react";
import Link from "next/link";
import { saveReportCardEvaluation } from "@/lib/actions";

type ReportCard = {
  id: number;
  reading: number;
  grammar: number;
  listening: number;
  speaking: number;
  total: number;
  observations: string;
  dateText: string;
};

type StudentItem = {
  id: string;
  name: string;
  reportCards: ReportCard[];
};

type EvaluateClassClientProps = {
  classId: string;
  className: string;
  teacherId: string;
  students: StudentItem[];
};

export default function EvaluateClassClient({
  classId,
  className,
  teacherId,
  students,
}: EvaluateClassClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStudent, setActiveStudent] = useState<StudentItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [dateText, setDateText] = useState("Julio 2026");
  const [reading, setReading] = useState<number | "">("");
  const [grammar, setGrammar] = useState<number | "">("");
  const [listening, setListening] = useState<number | "">("");
  const [speaking, setSpeaking] = useState<number | "">("");
  const [observations, setObservations] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter students
  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate live average
  const calculateAverage = (): number => {
    const scores = [Number(reading), Number(grammar), Number(listening), Number(speaking)].filter(
      (s) => !isNaN(s) && s > 0
    );
    if (scores.length === 0) return 0;
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round(sum / scores.length);
  };

  // Open grading modal for a student
  const handleOpenGrading = (student: StudentItem) => {
    setActiveStudent(student);
    const existing = student.reportCards[0]; // Get most recent evaluation if any
    
    if (existing) {
      setDateText(existing.dateText);
      setReading(existing.reading);
      setGrammar(existing.grammar);
      setListening(existing.listening);
      setSpeaking(existing.speaking);
      setObservations(existing.observations);
    } else {
      setDateText("Julio 2026");
      setReading("");
      setGrammar("");
      setListening("");
      setSpeaking("");
      setObservations("");
    }
    
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;
    setErrorMsg(null);
    setLoading(true);

    const readingNum = Number(reading) || 0;
    const grammarNum = Number(grammar) || 0;
    const listeningNum = Number(listening) || 0;
    const speakingNum = Number(speaking) || 0;
    const totalNum = calculateAverage();

    if (readingNum < 0 || readingNum > 100 ||
        grammarNum < 0 || grammarNum > 100 ||
        listeningNum < 0 || listeningNum > 100 ||
        speakingNum < 0 || speakingNum > 100) {
      setErrorMsg("Todas las calificaciones deben estar entre 0 y 100.");
      setLoading(false);
      return;
    }

    try {
      const res = await saveReportCardEvaluation({
        studentId: activeStudent.id,
        classId,
        teacherId,
        dateText,
        reading: readingNum,
        grammar: grammarNum,
        listening: listeningNum,
        speaking: speakingNum,
        total: totalNum,
        observations: observations.trim(),
      });

      if (res.success) {
        setSuccessId(activeStudent.id);
        setTimeout(() => setSuccessId(null), 3000);
        setShowModal(false);
        // Reload data to reflect edits
        window.location.reload();
      } else {
        setErrorMsg(res.error || "Error al guardar la evaluación.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error de conexión al guardar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 flex-1 p-6 flex flex-col gap-6">
      
      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/teacher" className="text-xs text-[#F04F23] font-bold hover:underline">
              Panel de Control
            </Link>
            <span className="text-slate-300 text-xs">/</span>
            <span className="text-xs text-slate-500 font-medium">Evaluaciones</span>
          </div>
          <h1 className="text-2xl font-black text-[#2E4068] mt-1">Evaluar Alumnos: {className}</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Selecciona un alumno para capturar, calificar o actualizar su boletín bimestral / final.
          </p>
        </div>
        <Link href="/teacher">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-gray-600 font-semibold text-xs rounded-lg hover:bg-slate-50 transition-all duration-200 cursor-pointer shadow-sm">
            Volver a mi Panel
          </button>
        </Link>
      </div>

      {/* FILTER SEARCH */}
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <input
          type="text"
          placeholder="Buscar por nombre o matrícula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm focus:outline-none bg-white font-sans"
        />
        <div className="absolute left-3 top-3.5 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
          </svg>
        </div>
      </div>

      {/* STUDENTS LIST TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-wider">
              <th className="p-4">Matrícula</th>
              <th className="p-4">Nombre del Alumno</th>
              <th className="p-4 text-center">Estatus Evaluación</th>
              <th className="p-4 text-center">Calificación General (Promedio)</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => {
              const latestReport = student.reportCards[0];
              const isEvaluated = !!latestReport;

              return (
                <tr key={student.id} className="border-b border-slate-100 text-sm hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono text-xs font-bold text-slate-400">{student.id}</td>
                  <td className="p-4 font-bold text-[#2E4068]">{student.name}</td>
                  <td className="p-4 text-center">
                    {isEvaluated ? (
                      <span className="text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full text-xs font-bold">
                        Evaluado ({latestReport.dateText})
                      </span>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {isEvaluated ? (
                      <span className="text-base font-black text-slate-700">
                        {latestReport.total} / 100
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-xs">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenGrading(student)}
                        className="bg-[#2E4068] hover:bg-opacity-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm"
                      >
                        {isEvaluated ? "Editar Notas" : "Capturar Notas"}
                      </button>
                      {successId === student.id && (
                        <span className="text-xs text-green-600 font-bold animate-bounce">
                          ¡Guardado!
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* GRADING MODAL */}
      {showModal && activeStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#F04F23]"></div>
            
            {/* MODAL HEADER */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Boletín e Historial
                </span>
                <h3 className="text-lg font-black text-[#2E4068] mt-1">
                  Calificar a: {activeStudent.name}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* MODAL FORM */}
            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
              
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-xs font-semibold text-center">
                  {errorMsg}
                </div>
              )}

              {/* Period Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-bold">Período de Evaluación (Texto del Boletín)</label>
                <input
                  type="text"
                  placeholder="Ej. Julio 2026 o Bimestre 1"
                  value={dateText}
                  onChange={(e) => setDateText(e.target.value)}
                  required
                  className="ring-[1.5px] ring-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4068] font-sans"
                />
              </div>

              {/* Skills Inputs */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Lectura */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-500 font-bold">Lectura (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    value={reading}
                    onChange={(e) => setReading(e.target.value === "" ? "" : Number(e.target.value))}
                    required
                    className="ring-[1.5px] ring-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4068] font-sans font-mono"
                  />
                </div>

                {/* Gramática */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-500 font-bold">Gramática (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    value={grammar}
                    onChange={(e) => setGrammar(e.target.value === "" ? "" : Number(e.target.value))}
                    required
                    className="ring-[1.5px] ring-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4068] font-sans font-mono"
                  />
                </div>

                {/* Escucha Comprensiva */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-500 font-bold">Escucha Comprensiva (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    value={listening}
                    onChange={(e) => setListening(e.target.value === "" ? "" : Number(e.target.value))}
                    required
                    className="ring-[1.5px] ring-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4068] font-sans font-mono"
                  />
                </div>

                {/* Expresión Oral */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-500 font-bold">Expresión Oral (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    value={speaking}
                    onChange={(e) => setSpeaking(e.target.value === "" ? "" : Number(e.target.value))}
                    required
                    className="ring-[1.5px] ring-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4068] font-sans font-mono"
                  />
                </div>

              </div>

              {/* LIVE PROMEDIO INDICATOR */}
              <div className="bg-[#E4ECFA]/55 p-3 rounded-2xl border border-[#D0DEF2] flex justify-between items-center text-sm my-1">
                <span className="font-bold text-[#2E4068] uppercase tracking-wide text-xs">Promedio Calculado (Total)</span>
                <span className="text-lg font-black text-gray-800 font-mono bg-white border border-slate-200 px-3 py-1 rounded-xl shadow-sm">
                  {calculateAverage()} / 100
                </span>
              </div>

              {/* Observations */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-bold">Observaciones de Avance del Alumno</label>
                <textarea
                  rows={3}
                  placeholder="Ej. Alondra es una alumna muy aplicada..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  required
                  className="ring-[1.5px] ring-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4068] font-sans resize-none"
                />
              </div>

              {/* MODAL FOOTER */}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#F04F23] hover:opacity-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar Calificaciones"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
