import prisma from "@/lib/prisma";
import Link from "next/link";

const PaymentAlerts = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch any pending or overdue payments, oldest first
  const pendingPayments = await prisma.payment.findMany({
    where: {
      status: { in: ["Pendiente", "Atrasado"] },
    },
    include: {
      student: {
        select: {
          name: true,
          classId: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
    take: 5,
  });

  return (
    <div className="bg-white p-4 rounded-md border border-orange-100 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-md font-bold text-gray-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-vocaliOrange animate-pulse">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          Alertas de Pago
        </h1>
        <Link href="/list/payments" className="text-xs text-vocaliBlue hover:underline font-medium">
          Ver todos
        </Link>
      </div>

      {pendingPayments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-4 text-center border border-dashed border-green-200 rounded-md bg-green-50/50">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-green-500 mb-2">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4.13-5.68Z" clipRule="evenodd" />
          </svg>
          <p className="text-xs font-semibold text-green-800">¡Al corriente!</p>
          <p className="text-[10px] text-green-600 mt-0.5">No hay cobros pendientes o atrasados en este momento.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pendingPayments.map((p) => {
            const isOverdue = new Date(p.dueDate) < today;
            const bgClass = isOverdue ? "bg-red-50/50 border-red-100" : "bg-orange-50/50 border-orange-100";
            const textClass = isOverdue ? "text-red-700 bg-red-100" : "text-orange-700 bg-orange-100";
            const labelText = isOverdue ? "Vencido" : "Pendiente";

            return (
              <div key={p.id} className={`rounded-md p-3 border ${bgClass} transition-all duration-200 hover:shadow-sm`}>
                <div className="flex items-center justify-between">
                  <Link href={`/list/students/${p.studentId}`} className="font-semibold text-sm text-gray-800 hover:text-vocaliBlue hover:underline">
                    {p.student.name}
                  </Link>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${textClass}`}>
                    {labelText}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>Monto: <strong className="text-gray-700">${p.amount.toLocaleString("es-MX")}</strong></span>
                  <span>Vence: <strong className="text-gray-700">{new Date(p.dueDate).toLocaleDateString("es-MX")}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PaymentAlerts;
