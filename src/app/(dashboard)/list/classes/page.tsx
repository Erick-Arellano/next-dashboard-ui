export const dynamic = "force-dynamic";

import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import Image from "next/image";

type Class = {
  id: string;
  name: string;
  capacity: number;
  minCapacity: number;
  maxCapacity: number;
  grade: number;
  supervisor?: {
    name: string;
  } | null;
  _count?: {
    students: number;
  };
};

const columns = [
  {
    header: "Grupo (Código)",
    accessor: "name",
  },
  {
    header: "Alumnos Inscritos",
    accessor: "studentsCount",
  },
  {
    header: "Límites (Mín - Máx)",
    accessor: "limits",
    className: "hidden md:table-cell",
  },
  {
    header: "Estatus de Cupo",
    accessor: "status",
  },
  {
    header: "Nivel",
    accessor: "grade",
    className: "hidden md:table-cell",
  },
  {
    header: "Supervisor",
    accessor: "supervisor",
    className: "hidden md:table-cell",
  },
  {
    header: "Acciones",
    accessor: "action",
  },
];

const ClassListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { role } = await getSession();
  const { search, page } = searchParams;
  const p = page ? parseInt(page, 10) : 1;
  const ITEM_LIMIT = 10;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { id: { contains: search } },
    ];
  }

  const [classesData, count] = await prisma.$transaction([
    prisma.class.findMany({
      where,
      include: {
        supervisor: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      skip: ITEM_LIMIT * (p - 1),
      take: ITEM_LIMIT,
    }),
    prisma.class.count({ where }),
  ]);

  const renderRow = (item: Class) => {
    const studentCount = item._count?.students || 0;
    const min = item.minCapacity;
    const max = item.maxCapacity;

    let statusText = "Óptimo";
    let statusColor = "bg-green-100 text-green-800 border border-green-200";

    if (studentCount < min) {
      statusText = `Incompleto (< ${min})`;
      statusColor = "bg-yellow-100 text-yellow-800 border border-yellow-200";
    } else if (studentCount > max) {
      statusText = `Sobrecupo (> ${max})`;
      statusColor = "bg-purple-100 text-purple-800 border border-purple-200";
    } else if (studentCount === max) {
      statusText = "Lleno";
      statusColor = "bg-red-100 text-red-800 border border-red-200";
    }

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4">
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{item.name}</span>
            <span className="text-xs text-gray-400 font-mono font-medium">{item.id}</span>
          </div>
        </td>
        <td className="p-4 font-medium text-gray-700">{studentCount} alumnos</td>
        <td className="hidden md:table-cell p-4 text-gray-500 font-mono">
          {min} - {max}
        </td>
        <td className="p-4">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
            {statusText}
          </span>
        </td>
        <td className="hidden md:table-cell p-4 font-medium">Nivel {item.grade}</td>
        <td className="hidden md:table-cell p-4 text-gray-600">{item.supervisor?.name || "-"}</td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            {role === "admin" && (
              <>
                <FormModal table="class" type="update" data={item} />
                <FormModal table="class" type="delete" id={item.id} />
              </>
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
        <h1 className="hidden md:block text-lg font-semibold">Todos los Grupos</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormModal table="class" type="create" />}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={classesData} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ClassListPage;
