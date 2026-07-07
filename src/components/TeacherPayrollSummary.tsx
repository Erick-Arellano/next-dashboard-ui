"use client";

import Link from "next/link";

type TeacherPayrollSummaryProps = {
  teacherId: string;
  teacherName: string;
  pendingHours: number;
  pendingAmount: number;
  lastPaymentAmount: number | null;
  lastPaymentDate: Date | null;
};

const TeacherPayrollSummary = ({
  teacherId,
  teacherName,
  pendingHours,
  pendingAmount,
  lastPaymentAmount,
  lastPaymentDate,
}: TeacherPayrollSummaryProps) => {
  const hasPending = pendingAmount > 0;

  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Control de Nómina (Egreso)</h1>
        <span className="text-xs text-gray-400 font-medium font-mono">{teacherId}</span>
      </div>

      {/* ALERT BADGE */}
      {hasPending ? (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3.5 flex items-start gap-3">
          <div className="text-amber-500 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.2-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-800">Pagos Pendientes por Liquidar</h4>
            <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
              El profesor tiene acumuladas <b>{pendingHours} hrs</b> trabajadas pendientes de cobro por un monto de <b>${pendingAmount.toLocaleString("es-MX")} MXN</b>.
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
            <h4 className="text-xs font-bold text-green-800">Nómina al Corriente</h4>
            <p className="text-xs text-green-600 mt-0.5 leading-relaxed">
              No hay horas o nóminas pendientes de pago registradas en el sistema para este profesor.
            </p>
          </div>
        </div>
      )}

      {/* STATS */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs border-b border-gray-100 pb-2">
          <span className="text-gray-400 font-medium">Horas Pendientes</span>
          <span className={`font-bold font-mono ${pendingHours > 0 ? "text-amber-600" : "text-gray-600"}`}>
            {pendingHours} hrs
          </span>
        </div>
        <div className="flex items-center justify-between text-xs border-b border-gray-100 pb-2">
          <span className="text-gray-400 font-medium">Último Pago Liquidado</span>
          <span className="font-bold text-gray-700">
            {lastPaymentAmount !== null ? `$${lastPaymentAmount.toLocaleString("es-MX")} MXN` : "-"}
          </span>
        </div>
        {lastPaymentDate && (
          <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium font-mono self-end -mt-1.5">
            <span>Fecha: {new Date(lastPaymentDate).toLocaleDateString("es-MX")}</span>
          </div>
        )}
      </div>

      {/* LINK BUTTON */}
      <Link 
        href={`/list/teacher-payments?teacherId=${teacherId}`}
        className="w-full text-center bg-blue-50 text-vocaliBlue hover:bg-vocaliBlue hover:text-white border border-blue-100 py-2 rounded-md text-xs font-semibold transition-all duration-200 block"
      >
        Ver Historial de Nómina
      </Link>
    </div>
  );
};

export default TeacherPayrollSummary;
