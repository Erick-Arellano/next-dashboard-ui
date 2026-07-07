import prisma from "@/lib/prisma";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import FormModal from "@/components/FormModal";
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type ReportCardItem = {
  id: number;
  studentId: string;
  student: { name: string };
  classId: string;
  class: { name: string };
  teacherId: string;
  teacher: { name: string };
  dateText: string;
  createdAt: Date;
  reading: number;
  grammar: number;
  listening: number;
  speaking: number;
  total: number;
  observations: string;
};

const columns = [
  {
    header: "Alumno",
    accessor: "student",
  },
  {
    header: "Curso / Grupo",
    accessor: "class",
    className: "hidden md:table-cell",
  },
  {
    header: "Ciclo",
    accessor: "dateText",
  },
  {
    header: "Promedio",
    accessor: "total",
  },
  {
    header: "Fecha Emisión",
    accessor: "createdAt",
    className: "hidden md:table-cell",
  },
  {
    header: "Acciones",
    accessor: "action",
  },
];

export default async function ReportCardListPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const { role, teacherId: sessionTeacherId } = await getSession();
  const { search } = searchParams;

  const where: any = {};
  if (role === "teacher" && sessionTeacherId) {
    where.teacherId = sessionTeacherId;
  }

  if (search) {
    where.OR = [
      { studentId: { contains: search } },
      { student: { name: { contains: search } } },
      { classId: { contains: search } },
      { class: { name: { contains: search } } },
    ];
  }

  // 1. Fetch Report Cards
  const reportCardsData = await prisma.reportCard.findMany({
    where,
    include: {
      student: { select: { name: true } },
      class: { select: { name: true } },
      teacher: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  }) as unknown as ReportCardItem[];

  // 2. Fetch Students for Autofill Form
  const dbStudents = await prisma.student.findMany({
    include: {
      class: {
        include: {
          supervisor: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const studentsFormatted = dbStudents.map((s) => ({
    id: s.id,
    name: s.name,
    classId: s.classId,
    className: s.class?.name || "Sin grupo",
    teacherId: s.class?.supervisor?.id || "",
    teacherName: s.class?.supervisor?.name || "Sin profesor",
  }));

  const renderRow = (item: ReportCardItem) => {
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4">
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{item.student.name}</span>
            <span className="text-xs text-gray-400 font-mono font-medium">{item.studentId}</span>
          </div>
        </td>
        <td className="hidden md:table-cell p-4 font-semibold text-gray-700">
          {item.class.name}
        </td>
        <td className="p-4 text-gray-600 font-medium">
          {item.dateText}
        </td>
        <td className="p-4">
          <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${
            item.total >= 90
              ? "bg-green-50 text-green-700 border-green-200"
              : item.total >= 70
              ? "bg-blue-50 text-vocaliBlue border-blue-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}>
            {item.total}
          </span>
        </td>
        <td className="hidden md:table-cell p-4 text-gray-500 font-mono">
          {new Date(item.createdAt).toLocaleDateString("es-MX")}
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            {/* VIEW / PRINT BOLETIN LINK */}
            <Link
              href={`/list/report-cards/${item.id}`}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSkyLight hover:bg-lamaSky hover:text-white transition-all duration-200 border border-sky-100 text-sky-600"
              title="Ver Boletín e Imprimir"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h-11.32m11.32 0a49.255 49.255 0 0 0 1.258-2.035c.216-.382.228-.829-.028-1.203a54.437 54.437 0 0 0-3.187-4.189c-.588-.706-1.538-.779-2.147-.148L11.5 13.047a2.25 2.25 0 0 1-3.182 0l-1.025-1.026c-.609-.61-1.56-.537-2.148.17a54.407 54.407 0 0 0-3.186 4.19c-.256.374-.24.821-.029 1.203A49.304 49.304 0 0 0 6.34 18" />
              </svg>
            </Link>

            {role === "admin" && (
              <>
                <FormModal
                  table="reportCard"
                  type="update"
                  data={{
                    reportCard: item,
                    students: studentsFormatted,
                  }}
                />
                <FormModal table="reportCard" type="delete" id={item.id} />
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 shadow-sm border border-gray-150">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-bold text-gray-800">Historial de Calificaciones</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 border border-gray-200 hover:bg-slate-100 transition shadow-sm">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 border border-gray-200 hover:bg-slate-100 transition shadow-sm">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              <FormModal
                table="reportCard"
                type="create"
                data={{ students: studentsFormatted }}
              />
            )}
          </div>
        </div>
      </div>

      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={reportCardsData} />
    </div>
  );
}
