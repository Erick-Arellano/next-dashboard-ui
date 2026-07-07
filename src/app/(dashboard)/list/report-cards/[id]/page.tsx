import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function ReportCardDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const reportCard = await prisma.reportCard.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      student: { select: { name: true } },
      class: { select: { name: true } },
      teacher: { select: { name: true } },
    },
  });

  if (!reportCard) {
    notFound();
  }

  // Determine Letter Grade
  const getLetterGrade = (score: number) => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "E";
  };

  const letterGrade = getLetterGrade(reportCard.total);

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:p-0 print:bg-white flex flex-col items-center">
      {/* ACTION BAR (HIDDEN IN PRINT) */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-6 print:hidden">
        <Link
          href="/list/report-cards"
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-vocaliBlue transition bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm font-semibold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Volver a Calificaciones
        </Link>
        <PrintButton />
      </div>

      {/* BOLETIN CONTAINER */}
      <div className="w-full max-w-3xl bg-white shadow-lg print:shadow-none border border-slate-200 print:border-none rounded-xl print:rounded-none overflow-hidden flex flex-col justify-between min-h-[297mm] print:min-h-[262mm] print:h-[262mm] print:w-full print:max-w-full">
        
        {/* BLUE HEADER (Vocali Logo Banner) */}
        <div className="bg-[#2E4068] px-8 py-6 text-white flex justify-between items-center border-b-[8px] border-[#F04F23] print:py-2.5 print:px-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="logo" width={36} height={36} className="object-contain print:w-7 print:h-7" />
            <span className="font-extrabold text-2xl tracking-tight text-white print:text-lg">Vocali</span>
          </div>
          <div className="flex flex-col items-end justify-center">
            <span className="text-[9px] uppercase tracking-widest font-black text-slate-300 print:text-[7px]">LENGUAS EXTRANJERAS</span>
          </div>
        </div>

        {/* BODY CONTENT */}
        <div className="p-8 flex-1 flex flex-col justify-between gap-6 print:p-4 print:gap-3">
          {/* TITLE */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#2E4068] tracking-wide uppercase print:text-lg">Boletín de Calificaciones</h1>
            <div className="w-20 h-1 bg-[#F04F23] mx-auto mt-2 rounded-full print:h-0.5 print:w-12"></div>
          </div>

          {/* STUDENT DETAILS BOX */}
          <div className="bg-[#E4ECFA] p-6 rounded-xl border border-[#D0DEF2] grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:p-3 print:gap-2">
            <div className="flex flex-col gap-1.5 print:gap-0.5">
              <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider print:text-[9px]">Alumno/a:</span>
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 shadow-sm print:py-1 print:px-2 print:text-xs">
                {reportCard.student.name}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 print:gap-0.5">
              <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider print:text-[9px]">Profesor/a:</span>
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 shadow-sm print:py-1 print:px-2 print:text-xs">
                {reportCard.teacher.name}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 print:gap-0.5">
              <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider print:text-[9px]">Curso:</span>
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 shadow-sm print:py-1 print:px-2 print:text-xs">
                {reportCard.class.name}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 print:gap-0.5">
              <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider print:text-[9px]">Fecha:</span>
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 shadow-sm print:py-1 print:px-2 print:text-xs">
                {reportCard.dateText}
              </div>
            </div>
          </div>

          {/* EVALUATED SKILLS SECTION */}
          <div className="flex flex-col gap-3 print:gap-1">
            <h2 className="text-center font-bold text-[#2E4068] text-base uppercase tracking-wider print:text-sm">Conocimientos Evaluados</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-3">
              
              {/* LEFT & CENTER: SKILLS SCORES */}
              <div className="md:col-span-2 bg-[#E4ECFA] p-6 rounded-xl border border-[#D0DEF2] flex flex-col gap-3.5 justify-center print:col-span-2 print:p-3 print:gap-2">
                
                {/* LECTURA */}
                <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm print:p-1.5">
                  <span className="text-xs font-bold text-gray-600 print:text-[10px]">Lectura</span>
                  <span className="w-16 bg-[#E4ECFA] text-center py-1 rounded-md text-sm font-black text-gray-800 border border-[#D0DEF2] print:py-0.5 print:w-12 print:text-xs">
                    {reportCard.reading}
                  </span>
                </div>

                {/* GRAMÁTICA */}
                <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm print:p-1.5">
                  <span className="text-xs font-bold text-gray-600 print:text-[10px]">Gramática</span>
                  <span className="w-16 bg-[#E4ECFA] text-center py-1 rounded-md text-sm font-black text-gray-800 border border-[#D0DEF2] print:py-0.5 print:w-12 print:text-xs">
                    {reportCard.grammar}
                  </span>
                </div>

                {/* ESCUCHA COMPRENSIVA */}
                <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm print:p-1.5">
                  <span className="text-xs font-bold text-gray-600 print:text-[10px]">Escucha Comprensiva</span>
                  <span className="w-16 bg-[#E4ECFA] text-center py-1 rounded-md text-sm font-black text-gray-800 border border-[#D0DEF2] print:py-0.5 print:w-12 print:text-xs">
                    {reportCard.listening}
                  </span>
                </div>

                {/* EXPRESIÓN ORAL */}
                <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm print:p-1.5">
                  <span className="text-xs font-bold text-gray-600 print:text-[10px]">Expresión Oral</span>
                  <span className="w-16 bg-[#E4ECFA] text-center py-1 rounded-md text-sm font-black text-gray-800 border border-[#D0DEF2] print:py-0.5 print:w-12 print:text-xs">
                    {reportCard.speaking}
                  </span>
                </div>

                {/* TOTAL PROMEDIO */}
                <div className="flex justify-between items-center bg-[#E4ECFA] border-t border-[#D0DEF2] pt-3.5 print:pt-1.5">
                  <span className="text-xs font-black text-[#2E4068] uppercase tracking-wider print:text-[10px]">Total</span>
                  <span className="w-20 bg-[#F04F23] text-center py-1.5 rounded-lg text-sm font-black text-white shadow-md border border-[#F04F23] print:py-1 print:w-16 print:text-xs">
                    {reportCard.total}
                  </span>
                </div>

              </div>

              {/* RIGHT: GRADING SYSTEM SCALE */}
              <div className="bg-[#D3E1F5] p-5 rounded-xl border border-[#B8CDE8] flex flex-col justify-between print:p-3">
                <span className="text-center text-xs font-extrabold text-[#2E4068] uppercase tracking-wider border-b border-[#B8CDE8] pb-2 block print:pb-1 print:text-[10px]">
                  Sistema de Calificación
                </span>
                <div className="flex flex-col gap-2 mt-3 font-semibold text-xs text-gray-700 print:gap-1 print:mt-2 print:text-[10px]">
                  <div className="flex justify-between px-2 py-1 bg-white rounded border border-gray-100 shadow-sm print:py-0.5">
                    <span className="font-extrabold text-[#2E4068]">A</span>
                    <span className="text-gray-500 font-medium">90 - 100</span>
                  </div>
                  <div className="flex justify-between px-2 py-1 bg-white rounded border border-gray-100 shadow-sm print:py-0.5">
                    <span className="font-extrabold text-[#2E4068]">B</span>
                    <span className="text-gray-500 font-medium">80 - 89</span>
                  </div>
                  <div className="flex justify-between px-2 py-1 bg-white rounded border border-gray-100 shadow-sm print:py-0.5">
                    <span className="font-extrabold text-[#2E4068]">C</span>
                    <span className="text-gray-500 font-medium">70 - 79</span>
                  </div>
                  <div className="flex justify-between px-2 py-1 bg-white rounded border border-gray-100 shadow-sm print:py-0.5">
                    <span className="font-extrabold text-[#2E4068]">D</span>
                    <span className="text-gray-500 font-medium">60 - 69</span>
                  </div>
                  <div className="flex justify-between px-2 py-1 bg-white rounded border border-gray-100 shadow-sm print:py-0.5">
                    <span className="font-extrabold text-[#2E4068]">E</span>
                    <span className="text-gray-500 font-medium">0 - 59</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* OBSERVATIONS (LINED NOTEBOOK STYLE) */}
          <div className="flex flex-col gap-3 print:gap-1">
            <h2 className="text-center font-bold text-[#2E4068] text-base uppercase tracking-wider print:text-sm">Observaciones</h2>
            <div className="bg-[#E4ECFA] p-5 rounded-xl border border-[#D0DEF2] print:p-2.5">
              <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm relative overflow-hidden min-h-[160px] print:min-h-[105px] print:p-3">
                {/* Horizontal writing lines background */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40 px-6 py-5 print:px-3 print:py-2.5">
                  <div className="border-b border-gray-300 w-full h-[28px] print:h-[20px]"></div>
                  <div className="border-b border-gray-300 w-full h-[28px] print:h-[20px]"></div>
                  <div className="border-b border-gray-300 w-full h-[28px] print:h-[20px]"></div>
                  <div className="border-b border-gray-300 w-full h-[28px] print:h-[20px]"></div>
                  <div className="border-b border-gray-300 w-full h-[28px] print:h-[20px]"></div>
                </div>
                <p className="text-xs font-semibold text-gray-700 leading-[28px] print:leading-[20px] print:text-[10px] relative z-10 italic">
                  {reportCard.observations}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* BLUE BOTTOM DECORATION */}
        <div className="bg-[#2E4068] h-8 w-full border-t border-[#F04F23] print:h-4"></div>
      </div>
    </div>
  );
}
