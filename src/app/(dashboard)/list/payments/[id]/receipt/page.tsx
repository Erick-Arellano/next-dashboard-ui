import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { numeroALetras } from "@/lib/numberToLetters";
import Image from "next/image";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function PaymentReceiptPage({
  params,
}: {
  params: { id: string };
}) {
  const paymentId = parseInt(params.id, 10);
  if (isNaN(paymentId)) {
    return notFound();
  }

  // Fetch payment with student and class relation
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      student: {
        include: {
          class: true,
        },
      },
    },
  });

  if (!payment) {
    return notFound();
  }

  // Receipts are only for paid transactions
  if (payment.status !== "Pagado") {
    redirect("/list/payments");
  }

  const folioNumber = `REC-${String(payment.id).padStart(8, "0")}`;
  const formattedAmount = payment.amount.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const amountInLetters = numeroALetras(payment.amount);
  const paymentDateText = payment.paymentDate
    ? new Date(payment.paymentDate).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "-";

  const renderReceipt = (copyType: "alumno" | "escuela") => {
    return (
      <div className="w-[215.9mm] h-[127mm] print:w-full print:h-[120mm] bg-white border border-slate-200 print:border print:border-slate-300 shadow-md print:shadow-none rounded-xl print:rounded-lg overflow-hidden flex flex-col justify-between p-5 relative bg-no-repeat bg-right-bottom">
        
        {/* WATERMARK DECORATION */}
        <div className="absolute right-8 bottom-10 opacity-5 pointer-events-none no-print">
          <Image src="/logo.png" alt="watermark" width={140} height={140} />
        </div>

        {/* RECEIPT HEADER */}
        <div className="flex justify-between items-start border-b border-[#F04F23] pb-2">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="logo" width={28} height={28} className="object-contain" />
            <div className="flex flex-col">
              <span className="font-black text-base text-[#2E4068] tracking-tight leading-none">vocali</span>
              <span className="text-[6px] uppercase tracking-widest font-bold text-slate-500 mt-0.5">LENGUAS EXTRANJERAS</span>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <h1 className="text-sm font-black text-[#2E4068] uppercase tracking-wider leading-none">Recibo de Pago</h1>
              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border leading-none ${
                copyType === "alumno" 
                  ? "bg-blue-50 text-[#2E4068] border-blue-200" 
                  : "bg-orange-50 text-[#F04F23] border-orange-200"
              }`}>
                Copia {copyType === "alumno" ? "Alumno" : "Escuela"}
              </span>
            </div>
            <div className="flex flex-col items-end mt-0.5 gap-0.5">
              <span className="text-[9px] font-bold text-gray-500">
                Folio: <span className="font-mono text-xs text-[#F04F23] font-black">{folioNumber}</span>
              </span>
              <span className="text-[8px] text-gray-400 font-semibold">{paymentDateText}</span>
            </div>
          </div>
        </div>

        {/* RECEIPT BODY */}
        <div className="flex-1 my-2.5 flex flex-col justify-between gap-2.5">
          
          {/* CLIENT / STUDENT DETAILS */}
          <div className="bg-[#E4ECFA] p-2.5 rounded-lg border border-[#D0DEF2] grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wide">Recibimos de (Alumno/a):</span>
              <span className="font-bold text-gray-800 truncate">{payment.student.name}</span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wide">Matrícula:</span>
              <span className="font-mono font-bold text-gray-800">{payment.studentId}</span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wide">Curso / Grupo:</span>
              <span className="font-bold text-gray-800 truncate">{payment.student.class?.name || "Clase Individual / N/A"}</span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wide">Método de Pago:</span>
              <span className="font-bold text-gray-800">{payment.method || "Efectivo"}</span>
            </div>
          </div>

          {/* PAYMENT DETAILS */}
          <div className="grid grid-cols-3 gap-4 items-center">
            
            {/* CONCEPT & HOURS */}
            <div className="col-span-2 flex flex-col gap-1">
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wide">Por concepto de:</span>
                <span className="text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded px-2 py-0.5 shadow-sm">
                  {payment.type === "Por horas" 
                    ? `Pago de colegiatura por horas (${payment.hours} hrs cursadas)` 
                    : `Pago de Colegiatura (${payment.type})`
                  }
                </span>
              </div>
              <div className="text-[9px] text-gray-500 italic font-semibold leading-tight mt-0.5">
                Importe con letra: <span className="font-bold text-gray-700 capitalize">({amountInLetters.toLowerCase()})</span>
              </div>
            </div>

            {/* AMOUNT BOX */}
            <div className="bg-[#D3E1F5] p-2.5 rounded-lg border border-[#B8CDE8] text-center flex flex-col justify-center shadow-sm">
              <span className="text-[8px] text-[#2E4068] font-black uppercase tracking-wider block mb-0.5">Cantidad Recibida</span>
              <span className="text-lg font-black text-gray-800 tracking-tight">${formattedAmount} <span className="text-xs font-bold text-gray-500">MXN</span></span>
            </div>

          </div>

        </div>

        {/* SIGNATURE FIELDS */}
        <div className="grid grid-cols-2 gap-8 text-center mt-1.5 px-6">
          <div className="flex flex-col items-center">
            <div className="w-full border-t border-gray-400 pt-1 text-[8px] text-gray-500 font-bold uppercase tracking-wide">
              Firma de Conformidad
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-full border-t border-gray-400 pt-1 text-[8px] text-gray-500 font-bold uppercase tracking-wide">
              Cajero / Sello Autorizado
            </div>
          </div>
        </div>

        {/* DECORATIVE BOTTOM ACCENT */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#2E4068] border-t border-[#F04F23]"></div>
      </div>
    );
  };

  return (
    <div className="bg-slate-100 min-h-screen p-6 flex flex-col items-center gap-6 print:bg-white print:p-0">
      {/* Page styles to force single-page Letter size (portrait) with double receipt when printing */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: 8.5in 11in !important; /* Letter size portrait */
                margin: 0.4in 0.25in !important;
              }
              body {
                background-color: white !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .no-print {
                display: none !important;
              }
              * {
                font-family: Arial, Helvetica, sans-serif !important;
              }
            }
          `,
        }}
      />

      {/* TOP HEADER CONTROLS (Hidden on print) */}
      <div className="w-full max-w-[215.9mm] flex items-center justify-between no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <Link href="/list/payments">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-gray-600 font-semibold text-xs rounded-lg hover:bg-slate-50 transition-all duration-200 cursor-pointer shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Volver a Cobros
          </button>
        </Link>
        <PrintButton />
      </div>

      {/* DOUBLE RECEIPT CONTAINER */}
      <div className="flex flex-col gap-6 print:gap-0 print:h-[245mm] print:justify-between w-full max-w-[215.9mm] print:max-w-full">
        {/* 1. COPIA ALUMNO */}
        {renderReceipt("alumno")}

        {/* CUTTING DIVIDER (Hidden on screen, visible on print) */}
        <div className="hidden print:flex w-full items-center justify-center my-4 text-slate-400 text-[10px] font-mono select-none">
          <span>✂ - - - - - - - - - - - - - - - - - - - - CORTAR AQUÍ - - - - - - - - - - - - - - - - - - - - ✂</span>
        </div>

        {/* 2. COPIA ESCUELA */}
        {renderReceipt("escuela")}
      </div>
    </div>
  );
}
