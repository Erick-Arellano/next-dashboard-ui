"use client";

import Link from "next/link";

type StudentPaymentStatusProps = {
  studentId: string;
  studentName: string;
  paidCount: number;
  pendingCount: number;
  totalPendingAmount: number;
};

const StudentPaymentStatus = ({
  studentId,
  studentName,
  paidCount,
  pendingCount,
  totalPendingAmount,
}: StudentPaymentStatusProps) => {
  const hasDebt = totalPendingAmount > 0;

  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Estatus de Pagos / Colegiatura</h1>
        <span className="text-xs text-gray-400 font-medium font-mono">{studentId}</span>
      </div>

      {/* ALERT BADGE */}
      {hasDebt ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-3.5 flex items-start gap-3">
          <div className="text-red-500 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-red-800">Saldo Pendiente Detectado</h4>
            <p className="text-xs text-red-600 mt-0.5 leading-relaxed">
              El alumno tiene <b>{pendingCount} cobro(s)</b> pendientes con un saldo acumulado de <b>${totalPendingAmount.toLocaleString("es-MX")} MXN</b>.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-md p-3.5 flex items-start gap-3">
          <div className="text-green-500 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-green-800">Ficha al Corriente</h4>
            <p className="text-xs text-green-600 mt-0.5 leading-relaxed">
              El alumno se encuentra al corriente con todos sus cobros y mensualidades liquidadas.
            </p>
          </div>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 mt-1">
        <div className="bg-slate-50 border border-slate-100 p-3 rounded-md text-center">
          <span className="text-xs text-gray-400 block font-medium">Liquidados</span>
          <span className="text-xl font-bold text-gray-700 block mt-1">{paidCount}</span>
        </div>
        <div className="bg-slate-50 border border-slate-100 p-3 rounded-md text-center">
          <span className="text-xs text-gray-400 block font-medium">Pendientes</span>
          <span className={`text-xl font-bold block mt-1 ${pendingCount > 0 ? "text-red-500" : "text-gray-700"}`}>{pendingCount}</span>
        </div>
      </div>

      {/* LINK BUTTON */}
      <Link 
        href={`/list/payments?search=${studentId}`}
        className="w-full text-center bg-blue-50 text-vocaliBlue hover:bg-vocaliBlue hover:text-white border border-blue-100 py-2 rounded-md text-xs font-semibold transition-all duration-200 block"
      >
        Ver Todos los Cobros
      </Link>
    </div>
  );
};

export default StudentPaymentStatus;
