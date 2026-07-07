export const dynamic = "force-dynamic";

import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import ListHeaderToolbar from "@/components/ListHeaderToolbar";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import CopyMagicLinkButton from "@/components/CopyMagicLinkButton";
import ExportButton from "@/components/ExportButton";

type Teacher = {
  id: string;
  name: string;
  email?: string | null;
  photo?: string | null;
  phone?: string | null;
  subjects: { name: string }[];
  classes: { name: string }[];
  address?: string | null;
};

const columns = [
  {
    header: "Información",
    accessor: "info",
  },
  {
    header: "ID Profesor",
    accessor: "teacherId",
    className: "hidden md:table-cell",
  },
  {
    header: "Cursos",
    accessor: "subjects",
    className: "hidden md:table-cell",
  },
  {
    header: "Grupos",
    accessor: "classes",
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

const TeacherListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { role } = await getSession();
  const { search, subject, sort, classId, page } = searchParams;
  const p = page ? parseInt(page, 10) : 1;
  const ITEM_LIMIT = 10;

  // Build prisma query where clause
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { id: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  if (subject) {
    where.subjects = {
      some: {
        name: subject,
      },
    };
  }

  if (classId) {
    where.classes = {
      some: {
        id: classId,
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

  // Fetch teachers data with filter/sort/pagination applied
  const [teachersData, count, exportData] = await prisma.$transaction([
    prisma.teacher.findMany({
      where,
      include: {
        subjects: {
          select: {
            name: true,
          },
        },
        classes: {
          select: {
            name: true,
          },
        },
      },
      orderBy,
      skip: ITEM_LIMIT * (p - 1),
      take: ITEM_LIMIT,
    }),
    prisma.teacher.count({ where }),
    prisma.teacher.findMany({
      where,
      include: {
        subjects: {
          select: {
            name: true,
          },
        },
        classes: {
          select: {
            name: true,
          },
        },
      },
      orderBy,
    }),
  ]);

  // Query subjects to populate filter options
  const subjects = await prisma.subject.findMany({
    select: { name: true },
    orderBy: { name: "asc" },
  });

  const subjectOptions = subjects.map((s) => ({ label: s.name, value: s.name }));

  const filterOptions = [
    {
      label: "Curso / Idioma",
      paramName: "subject",
      options: subjectOptions,
    },
  ];

  const sortOptions = [
    { label: "Nombre (A-Z)", value: "name-asc" },
    { label: "Nombre (Z-A)", value: "name-desc" },
    { label: "ID Profesor (Menor a Mayor)", value: "id-asc" },
    { label: "ID Profesor (Mayor a Menor)", value: "id-desc" },
  ];

  const exportColumns = [
    { header: "Matrícula", key: "id" },
    { header: "Nombre", key: "name" },
    { header: "Teléfono", key: "phone" },
    { header: "Dirección", key: "address" },
    { header: "Correo electrónico", key: "email" },
  ];

  const renderRow = (item: Teacher) => (
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
          <p className="text-xs text-gray-500">{item?.email || "-"}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.id}</td>
      <td className="hidden md:table-cell">
        {item.subjects.map((s) => s.name).join(", ")}
      </td>
      <td className="hidden md:table-cell">
        {item.classes.map((c) => c.name).join(", ")}
      </td>
      <td className="hidden md:table-cell">{item.phone || "-"}</td>
      <td className="hidden md:table-cell">{item.address || "-"}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/teachers/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 text-vocaliBlue hover:bg-vocaliBlue hover:text-white transition-all duration-200 shadow-sm border border-blue-100 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </button>
          </Link>
          {role === "admin" && (
            <CopyMagicLinkButton teacherId={item.id} />
          )}
          {role === "admin" && (
            <FormModal table="teacher" type="delete" id={item.id}/>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Todos los Profesores</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <ListHeaderToolbar
            placeholder="Buscar profesor..."
            filterOptions={filterOptions}
            sortOptions={sortOptions}
          />
          <div className="flex items-center gap-4 self-end">
            <ExportButton
              data={exportData}
              filename="Profesores_Vocali.csv"
              columns={exportColumns}
            />
            {role === "admin" && (
              <FormModal table="teacher" type="create"/>
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={teachersData} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default TeacherListPage;
