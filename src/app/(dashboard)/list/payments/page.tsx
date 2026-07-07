export const dynamic = "force-dynamic";

import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import ListHeaderToolbar from "@/components/ListHeaderToolbar";
import ExportButton from "@/components/ExportButton";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

type Payment = {
  id: number;
  studentId: string;
  student: {
    name: string;
    classId: string | null;
  };
  amount: number;
  hours: number;
  type: string;
  status: string;
  dueDate: Date;
  paymentDate: Date | null;
  method: string | null;
};

const columns = [
  {
    header: "Matrícula",
    accessor: "studentId",
  },
  {
    header: "Nombre",
    accessor: "studentName",
  },
  {
    header: "Grupo",
    accessor: "class",
    className: "hidden md:table-cell",
  },
  {
    header: "Fecha Pago",
    accessor: "paymentDate",
    className: "hidden lg:table-cell",
  },
  {
    header: "Horas Pagadas",
    accessor: "hours",
    className: "hidden md:table-cell",
  },
  {
    header: "Estado",
    accessor: "status",
  },
  {
    header: "Monto",
    accessor: "amount",
  },
  {
    header: "Próximo Pago",
    accessor: "dueDate",
    className: "hidden md:table-cell",
  },
  {
    header: "Acciones",
    accessor: "action",
  },
];

const PaymentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { role } = await getSession();
  const { search, status, type, sort, page } = searchParams;
  const p = page ? parseInt(page, 10) : 1;
  const ITEM_LIMIT = 10;

  // Build prisma query where clause
  const where: any = {};

  if (search) {
    where.OR = [
      { studentId: { contains: search } },
      {
        student: {
          name: { contains: search },
        },
      },
      {
        student: {
          phone: { contains: search },
        },
      },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (type) {
    where.type = type;
  }

  // Build prisma query orderBy clause
  let orderBy: any = { dueDate: "desc" }; // default order
  if (sort) {
    if (sort === "dueDate-desc") orderBy = { dueDate: "desc" };
    else if (sort === "dueDate-asc") orderBy = { dueDate: "asc" };
    else if (sort === "amount-desc") orderBy = { amount: "desc" };
    else if (sort === "amount-asc") orderBy = { amount: "asc" };
    else if (sort === "studentName-asc") orderBy = { student: { name: "asc" } };
    else if (sort === "studentName-desc") orderBy = { student: { name: "desc" } };
  }

  // Fetch payments data with filter/sort/pagination applied
  const [paymentsData, count, exportData] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      include: {
        student: {
          select: {
            name: true,
            classId: true,
          },
        },
      },
      orderBy,
      skip: ITEM_LIMIT * (p - 1),
      take: ITEM_LIMIT,
    }),
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      include: {
        student: {
          select: {
            name: true,
            classId: true,
          },
        },
      },
      orderBy,
    }),
  ]);

  const serializedPaymentsForExport = exportData.map((item) => ({
    studentId: item.studentId,
    studentName: item.student?.name || "-",
    studentClassId: item.student?.classId || "-",
    type: item.type,
    hours: item.hours,
    amount: item.amount,
    status: item.status,
    paymentDateStr: item.paymentDate ? new Date(item.paymentDate).toLocaleDateString("es-MX") : "-",
    dueDateStr: new Date(item.dueDate).toLocaleDateString("es-MX"),
    method: item.method || "-",
  }));

  const exportColumns = [
    { header: "Matrícula", key: "studentId" },
    { header: "Alumno", key: "studentName" },
    { header: "Grupo", key: "studentClassId" },
    { header: "Tipo de Pago", key: "type" },
    { header: "Horas Pagadas", key: "hours" },
    { header: "Monto", key: "amount" },
    { header: "Estatus", key: "status" },
    { header: "Fecha Pago", key: "paymentDateStr" },
    { header: "Próximo Pago", key: "dueDateStr" },
    { header: "Método de Pago", key: "method" },
  ];

  // Dynamic filter values can be hardcoded here since they are based on system definitions
  const filterOptions = [
    {
      label: "Estado",
      paramName: "status",
      options: [
        { label: "Pagado", value: "Pagado" },
        { label: "Pendiente", value: "Pendiente" },
        { label: "Atrasado", value: "Atrasado" },
      ],
    },
    {
      label: "Tipo de Cobro",
      paramName: "type",
      options: [
        { label: "Mensual", value: "Mensual" },
        { label: "Por horas", value: "Por horas" },
        { label: "Curso completo", value: "Curso completo" },
      ],
    },
  ];

  const sortOptions = [
    { label: "Próximo Pago (Más reciente)", value: "dueDate-desc" },
    { label: "Próximo Pago (Más antiguo)", value: "dueDate-asc" },
    { label: "Monto (Mayor a Menor)", value: "amount-desc" },
    { label: "Monto (Menor a Mayor)", value: "amount-asc" },
    { label: "Alumno (A-Z)", value: "studentName-asc" },
    { label: "Alumno (Z-A)", value: "studentName-desc" },
  ];

  const renderRow = (item: Payment) => {
    let statusColor = "bg-yellow-100 text-yellow-800";
    if (item.status === "Pagado") statusColor = "bg-green-100 text-green-800";
    if (item.status === "Atrasado") statusColor = "bg-red-100 text-red-800";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(item.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    const oneDay = 24 * 60 * 60 * 1000;
    const timeDiff = dueDate.getTime() - today.getTime();
    
    const isOverdue = (item.status === "Pendiente" || item.status === "Atrasado") && dueDate < today;
    const isApproaching = (item.status === "Pendiente" || item.status === "Atrasado") && dueDate >= today && timeDiff <= oneDay;

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4">
          <Link href={`/list/students/${item.studentId}`} className="hover:underline hover:text-vocaliBlue">
            {item.studentId}
          </Link>
        </td>
        <td className="p-4 font-semibold">
          <Link href={`/list/students/${item.studentId}`} className="hover:underline hover:text-vocaliBlue">
            {item.student.name}
          </Link>
        </td>
        <td className="hidden md:table-cell p-4">{item.student.classId || "-"}</td>
        <td className="hidden lg:table-cell p-4">
          {item.paymentDate ? item.paymentDate.toLocaleDateString("es-MX") : "-"}
        </td>
        <td className="hidden md:table-cell p-4">{item.hours} hrs</td>
        <td className="p-4">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
            {item.status}
          </span>
        </td>
        <td className="p-4 font-medium">${item.amount.toLocaleString("es-MX")}</td>
        <td className="hidden md:table-cell p-4">
          <div className="flex items-center gap-1.5">
            {item.dueDate.toLocaleDateString("es-MX")}
            {isOverdue && (
              <span className="text-red-500 flex items-center" title="¡Pago Vencido!">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                </svg>
              </span>
            )}
            {isApproaching && (
              <span className="text-orange-500 flex items-center" title="Vence pronto (menos de 24 horas)">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <Link href={`/list/students/${item.studentId}`} title="Ver Ficha Alumno">
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 text-vocaliBlue hover:bg-vocaliBlue hover:text-white transition-all duration-200 shadow-sm border border-blue-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </button>
            </Link>
            {item.status === "Pagado" && (
              <Link href={`/list/payments/${item.id}/receipt`} title="Ver / Imprimir Recibo">
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all duration-200 shadow-sm border border-emerald-100">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
                  </svg>
                </button>
              </Link>
            )}
            {role === "admin" && (
              <FormModal table="payment" type="delete" id={item.id} />
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Todos los Cobros</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <ListHeaderToolbar
            placeholder="Buscar cobro..."
            filterOptions={filterOptions}
            sortOptions={sortOptions}
          />
          <div className="flex items-center gap-4 self-end">
            <ExportButton
              data={serializedPaymentsForExport}
              filename="Cobros_Vocali.csv"
              columns={exportColumns}
            />
            {role === "admin" && (
              <FormModal table="payment" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={paymentsData} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default PaymentListPage;
