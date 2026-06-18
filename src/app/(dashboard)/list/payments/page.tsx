export const dynamic = "force-dynamic";

import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { role } from "@/lib/data";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

type Payment = {
  id: number;
  studentId: string;
  student: {
    name: string;
  };
  amount: number;
  type: string;
  status: string;
  dueDate: Date;
  paymentDate: Date | null;
  method: string | null;
};

const columns = [
  {
    header: "Alumno",
    accessor: "student",
  },
  {
    header: "Monto",
    accessor: "amount",
  },
  {
    header: "Tipo de Cobro",
    accessor: "type",
    className: "hidden md:table-cell",
  },
  {
    header: "Vencimiento",
    accessor: "dueDate",
    className: "hidden md:table-cell",
  },
  {
    header: "Estado",
    accessor: "status",
  },
  {
    header: "Fecha Pago",
    accessor: "paymentDate",
    className: "hidden lg:table-cell",
  },
  {
    header: "Método",
    accessor: "method",
    className: "hidden lg:table-cell",
  },
  {
    header: "Acciones",
    accessor: "action",
  },
];

const PaymentListPage = async () => {
  const paymentsData = await prisma.payment.findMany({
    include: {
      student: {
        select: {
          name: true,
        },
      },
    },
  });

  const renderRow = (item: Payment) => {
    let statusColor = "bg-yellow-100 text-yellow-800";
    if (item.status === "Pagado") statusColor = "bg-green-100 text-green-800";
    if (item.status === "Atrasado") statusColor = "bg-red-100 text-red-800";

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4 font-semibold">{item.student.name}</td>
        <td className="p-4 font-medium">${item.amount.toLocaleString("es-MX")}</td>
        <td className="hidden md:table-cell p-4">{item.type}</td>
        <td className="hidden md:table-cell p-4">
          {item.dueDate.toLocaleDateString("es-MX")}
        </td>
        <td className="p-4">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
            {item.status}
          </span>
        </td>
        <td className="hidden lg:table-cell p-4">
          {item.paymentDate ? item.paymentDate.toLocaleDateString("es-MX") : "-"}
        </td>
        <td className="hidden lg:table-cell p-4">{item.method || "-"}</td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <Link href={`/list/payments/${item.id}`}>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
                <Image src="/view.png" alt="" width={16} height={16} />
              </button>
            </Link>
            {role === "admin" && (
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
                <Image src="/delete.png" alt="" width={16} height={16} />
              </button>
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
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow font-bold text-lg">
                +
              </button>
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={paymentsData} />
      {/* PAGINATION */}
      <Pagination />
    </div>
  );
};

export default PaymentListPage;
