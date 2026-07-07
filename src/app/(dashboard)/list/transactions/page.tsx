export const dynamic = "force-dynamic";

import FormModal from "@/components/FormModal";
import Table from "@/components/Table";
import ExportButton from "@/components/ExportButton";
import Pagination from "@/components/Pagination";
import prisma from "@/lib/prisma";
import Image from "next/image";

type Transaction = {
  id: number;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: Date;
  description: string;
  paymentId: number | null;
  teacherPaymentId: number | null;
};

const columns = [
  {
    header: "Fecha",
    accessor: "date",
  },
  {
    header: "Tipo",
    accessor: "type",
  },
  {
    header: "Categoría",
    accessor: "category",
    className: "hidden md:table-cell",
  },
  {
    header: "Descripción",
    accessor: "description",
  },
  {
    header: "Monto",
    accessor: "amount",
  },
  {
    header: "Referencia",
    accessor: "reference",
    className: "hidden lg:table-cell",
  },
  {
    header: "Acciones",
    accessor: "action",
  },
];

const TransactionListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { type, category, search, page } = searchParams;
  const p = page ? parseInt(page, 10) : 1;
  const ITEM_LIMIT = 10;

  // Construir condiciones de búsqueda
  const where: any = {};
  if (type && type !== "all") {
    where.type = type;
  }
  if (category && category !== "all") {
    where.category = category;
  }
  if (search) {
    where.description = { contains: search };
  }

  // Consultar movimientos contables con paginación
  const [transactionsData, count, exportData] = await prisma.$transaction([
    prisma.transaction.findMany({
      where,
      orderBy: {
        date: "desc",
      },
      skip: ITEM_LIMIT * (p - 1),
      take: ITEM_LIMIT,
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: {
        date: "desc",
      },
    }),
  ]);

  // Calcular KPIs en base a la lista actual filtrada (completa para exportar)
  let totalIncome = 0;
  let totalExpense = 0;

  exportData.forEach((tx) => {
    if (tx.type === "INCOME") {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
    }
  });

  const netProfit = totalIncome - totalExpense;

  const serializedTransactionsForExport = exportData.map((item) => ({
    dateStr: new Date(item.date).toLocaleDateString("es-MX"),
    typeStr: item.type === "INCOME" ? "INGRESO" : "EGRESO",
    category: item.category,
    description: item.description,
    amount: item.amount,
    reference: item.paymentId
      ? `COBRO-${item.paymentId}`
      : item.teacherPaymentId
      ? `PAGO-PROFE-${item.teacherPaymentId}`
      : "MANUAL",
  }));

  const exportColumns = [
    { header: "Fecha", key: "dateStr" },
    { header: "Tipo", key: "typeStr" },
    { header: "Categoría", key: "category" },
    { header: "Descripción", key: "description" },
    { header: "Monto", key: "amount" },
    { header: "Referencia", key: "reference" },
  ];

  const renderRow = (item: Transaction) => {
    const isManual = !item.paymentId && !item.teacherPaymentId;

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4">
          {new Date(item.date).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </td>
        <td className="p-4">
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              item.type === "INCOME"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {item.type === "INCOME" ? "Ingreso" : "Egreso"}
          </span>
        </td>
        <td className="hidden md:table-cell p-4 font-medium text-gray-600">
          {item.category}
        </td>
        <td className="p-4 text-gray-700 max-w-[200px] md:max-w-[350px] truncate" title={item.description}>
          {item.description}
        </td>
        <td
          className={`p-4 font-semibold ${
            item.type === "INCOME" ? "text-green-700" : "text-red-700"
          }`}
        >
          {item.type === "INCOME" ? "+" : "-"}${item.amount.toLocaleString("es-MX", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </td>
        <td className="hidden lg:table-cell p-4 text-xs font-medium text-gray-400">
          {item.paymentId && (
            <span className="bg-slate-100 px-2 py-0.5 rounded border text-vocaliBlue border-slate-200">
              COBRO-{item.paymentId}
            </span>
          )}
          {item.teacherPaymentId && (
            <span className="bg-slate-100 px-2 py-0.5 rounded border text-vocaliOrange border-slate-200">
              NOMINA-{item.teacherPaymentId}
            </span>
          )}
          {isManual && (
            <span className="bg-slate-50 px-2 py-0.5 rounded border text-gray-500 border-gray-200 border-dashed">
              Manual
            </span>
          )}
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            {isManual ? (
              <FormModal table="transaction" type="delete" id={item.id} />
            ) : (
              <div
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                title="Movimiento contable sincronizado automáticamente. No se puede eliminar directamente por seguridad."
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-4 m-4 mt-0">
      {/* TOP HEADER */}
      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Bitácora Contable</h1>
          <p className="text-xs text-gray-400 mt-1">
            Registro cronológico general de todos los ingresos y egresos de Vocali.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            data={serializedTransactionsForExport}
            filename="Libro_Diario_Vocali.csv"
            columns={exportColumns}
          />
          <FormModal table="transaction" type="create" />
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* INGRESOS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 font-medium uppercase">Ingresos Totales</span>
            <span className="text-2xl font-bold text-green-700">
              ${totalIncome.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-gray-400">Mensualidades e Inscripciones</span>
          </div>
          <div className="p-3 bg-green-50 text-green-700 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
            </svg>
          </div>
        </div>

        {/* EGRESOS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 font-medium uppercase">Egresos Totales</span>
            <span className="text-2xl font-bold text-red-700">
              ${totalExpense.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-gray-400">Nómina y Gastos Operativos</span>
          </div>
          <div className="p-3 bg-red-50 text-red-700 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.306-4.307a11.95 11.95 0 0 1 5.814 5.519l2.74 1.22m0 0-5.94 2.28m5.94-2.28-2.28 5.941" />
            </svg>
          </div>
        </div>

        {/* BALANCE */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 font-medium uppercase">Utilidad Neta (Balance)</span>
            <span className={`text-2xl font-bold ${netProfit >= 0 ? "text-vocaliBlue" : "text-vocaliOrange"}`}>
              {netProfit >= 0 ? "" : "-"}${Math.abs(netProfit).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-gray-400">Utilidad antes de impuestos</span>
          </div>
          <div className={`p-3 rounded-full ${netProfit >= 0 ? "bg-blue-50 text-vocaliBlue" : "bg-orange-50 text-vocaliOrange"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.75-3.182a3 3 0 0 1 5.06 0l.75 3.182m-3-10v.008M12 3v3m0 12v3" />
            </svg>
          </div>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
        <form method="GET" className="flex items-center gap-3 flex-wrap text-sm w-full">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-400 uppercase font-semibold">Flujo</label>
            <select
              name="type"
              className="ring-1 ring-gray-300 p-2 rounded-md text-xs bg-white focus:outline-none focus:ring-vocaliBlue"
              defaultValue={type || "all"}
            >
              <option value="all">Todos los flujos</option>
              <option value="INCOME">Ingresos (Entradas)</option>
              <option value="EXPENSE">Egresos (Salidas)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-400 uppercase font-semibold">Categoría</label>
            <select
              name="category"
              className="ring-1 ring-gray-300 p-2 rounded-md text-xs bg-white focus:outline-none focus:ring-vocaliBlue"
              defaultValue={category || "all"}
            >
              <option value="all">Todas las categorías</option>
              <option value="Mensualidad">Mensualidad</option>
              <option value="Inscripción">Inscripción</option>
              <option value="Nómina">Nómina</option>
              <option value="Servicios">Servicios</option>
              <option value="Renta">Renta</option>
              <option value="Papelería/Materiales">Papelería/Materiales</option>
              <option value="Mantenimiento">Mantenimiento</option>
              <option value="Publicidad">Publicidad</option>
              <option value="Venta de Materiales">Venta de Materiales</option>
              <option value="Otros">Otros</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-[10px] text-gray-400 uppercase font-semibold">Búsqueda rápida</label>
            <div className="relative">
              <input
                type="text"
                name="search"
                placeholder="Buscar por descripción..."
                className="ring-1 ring-gray-300 p-2 pl-8 rounded-md text-xs bg-white w-full focus:outline-none focus:ring-vocaliBlue"
                defaultValue={search || ""}
              />
              <Image src="/search.png" alt="" width={12} height={12} className="absolute left-2.5 top-2.5 opacity-45" />
            </div>
          </div>

          <div className="flex items-end gap-2 h-full pt-4">
            <button
              type="submit"
              className="bg-vocaliBlue hover:bg-blue-600 text-white px-4 py-2 rounded-md text-xs font-semibold shadow-sm transition-all duration-200"
            >
              Filtrar
            </button>
            {(type || category || search) && (
              <a
                href="/list/transactions"
                className="text-gray-400 hover:text-gray-600 text-xs flex items-center h-[32px] px-2"
              >
                Limpiar
              </a>
            )}
          </div>
        </form>
      </div>

      {/* LIST TABLE */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        {transactionsData.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <p className="text-sm font-medium text-gray-500">No se encontraron movimientos contables en este periodo.</p>
            <p className="text-xs text-gray-400">Intenta remover o cambiar los filtros de búsqueda.</p>
          </div>
        ) : (
          <>
            <Table columns={columns} renderRow={renderRow} data={transactionsData} />
            <Pagination page={p} count={count} />
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionListPage;
