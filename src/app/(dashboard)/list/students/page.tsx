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

type Student = {
  id: string;
  name: string;
  email?: string | null;
  photo?: string | null;
  phone?: string | null;
  grade: number;
  classId?: string | null;
  class?: {
    id: string;
    name: string;
  } | null;
  address?: string | null;
};

const columns = [
  {
    header: "Información",
    accessor: "info",
  },
  {
    header: "Matrícula",
    accessor: "studentId",
    className: "hidden md:table-cell",
  },
  {
    header: "Nivel",
    accessor: "grade",
    className: "hidden md:table-cell",
  },
  {
    header: "Teléfono",
    accessor: "phone",
    className: "hidden lg:table-cell",
  },
  {
    header: "Dirección",
    accessor: "address",
    className: "hidden lg:table-cell",
  },
  {
    header: "Acciones",
    accessor: "action",
  },
];

const StudentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { role, teacherId: sessionTeacherId } = await getSession();
  const { search, classId, grade, sort, teacherId, page } = searchParams;
  const p = page ? parseInt(page, 10) : 1;
  const ITEM_LIMIT = 10;

  let activeTeacherId = teacherId;
  if (role === "teacher") {
    activeTeacherId = sessionTeacherId || undefined;
  }

  // Build prisma query where clause
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { id: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  if (classId) {
    where.classId = classId;
  }

  if (grade) {
    where.grade = parseInt(grade, 10);
  }

  if (activeTeacherId) {
    where.class = {
      lessons: {
        some: {
          teacherId: activeTeacherId,
        },
      },
    };
  }

  // Build prisma query orderBy clause
  let orderBy: any = { name: "asc" }; // default order
  if (sort) {
    const [field, order] = sort.split("-");
    if (field && (order === "asc" || order === "desc")) {
      orderBy = { [field]: order };
    }
  }

  // Fetch student data with filter/sort/pagination applied
  const [studentsData, count, exportData] = await prisma.$transaction([
    prisma.student.findMany({
      where,
      include: {
        class: true,
      },
      orderBy,
      skip: ITEM_LIMIT * (p - 1),
      take: ITEM_LIMIT,
    }),
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      include: {
        class: true,
      },
      orderBy,
    }),
  ]);

  // Query classes to populate dynamic filter options
  const classes = await prisma.class.findMany({
    select: { id: true, name: true, grade: true },
    orderBy: { name: "asc" },
  });

  const classOptions = classes.map((c) => ({ label: c.name, value: c.id }));
  
  // Extract unique grades from classes
  const gradeOptions = Array.from(new Set(classes.map((c) => c.grade)))
    .sort((a, b) => a - b)
    .map((g) => ({ label: `Nivel ${g}`, value: String(g) }));

  const filterOptions = [
    {
      label: "Grupo / Clase",
      paramName: "classId",
      options: classOptions,
    },
    {
      label: "Nivel Escolar",
      paramName: "grade",
      options: gradeOptions,
    },
  ];

  const sortOptions = [
    { label: "Nombre (A-Z)", value: "name-asc" },
    { label: "Nombre (Z-A)", value: "name-desc" },
    { label: "Matrícula (Menor a Mayor)", value: "id-asc" },
    { label: "Matrícula (Mayor a Menor)", value: "id-desc" },
    { label: "Nivel (Menor a Mayor)", value: "grade-asc" },
    { label: "Nivel (Mayor a Menor)", value: "grade-desc" },
  ];

  const exportColumns = [
    { header: "Matrícula", key: "id" },
    { header: "Nombre", key: "name" },
    { header: "Grupo", key: "classId" },
    { header: "Nivel Escolar", key: "grade" },
    { header: "Teléfono", key: "phone" },
    { header: "Dirección", key: "address" },
    { header: "Correo electrónico", key: "email" },
  ];

  const renderRow = (item: Student) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.photo || "/avatar.png"}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">{item.class?.name || "-"}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.id}</td>
      <td className="hidden md:table-cell">{item.grade}</td>
      <td className="hidden md:table-cell">{item.phone || "-"}</td>
      <td className="hidden md:table-cell">{item.address || "-"}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/students/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 text-vocaliBlue hover:bg-vocaliBlue hover:text-white transition-all duration-200 shadow-sm border border-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </button>
          </Link>
          {role === "admin" && (
            <FormModal table="student" type="delete" id={item.id}/>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Todos los Alumnos</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <ListHeaderToolbar
            placeholder="Buscar alumno..."
            filterOptions={filterOptions}
            sortOptions={sortOptions}
          />
          <div className="flex items-center gap-4 self-end">
            <ExportButton
              data={exportData}
              filename="Alumnos_Vocali.csv"
              columns={exportColumns}
            />
            {role === "admin" && (
              <FormModal table="student" type="create"/>
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={studentsData} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default StudentListPage;
