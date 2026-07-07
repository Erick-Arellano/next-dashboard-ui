export const dynamic = "force-dynamic";

import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import Image from "next/image";

type Announcement = {
  id: number;
  title: string;
  description?: string;
  classId?: string | null;
  date: Date;
};

const columns = [
  {
    header: "Título",
    accessor: "title",
  },
  {
    header: "Contenido",
    accessor: "description",
    className: "hidden lg:table-cell",
  },
  {
    header: "Grupo",
    accessor: "class",
  },
  {
    header: "Fecha",
    accessor: "date",
    className: "hidden md:table-cell",
  },
  {
    header: "Acciones",
    accessor: "action",
  },
];

const AnnouncementListPage = async ({
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
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  // Fetch Announcements with pagination
  const [announcementsData, count] = await prisma.$transaction([
    prisma.announcement.findMany({
      where,
      skip: ITEM_LIMIT * (p - 1),
      take: ITEM_LIMIT,
      orderBy: { date: "desc" },
    }),
    prisma.announcement.count({ where }),
  ]);

  // Fetch Classes for the dropdown selection
  const classes = await prisma.class.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const classesFormatted = classes.map((c) => ({ id: c.id, name: c.name }));

  const renderRow = (item: Announcement) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4 font-semibold text-gray-800">{item.title}</td>
      <td className="hidden lg:table-cell text-slate-500 max-w-xs truncate">{item.description || "-"}</td>
      <td>{item.classId || "Todos"}</td>
      <td className="hidden md:table-cell">{item.date.toLocaleDateString("es-MX")}</td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormModal
                table="announcement"
                type="update"
                data={{ ...item, classes: classesFormatted }}
              />
              <FormModal table="announcement" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          Todos los Anuncios
        </h1>
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
              <FormModal
                table="announcement"
                type="create"
                data={{ classes: classesFormatted }}
              />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={announcementsData} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default AnnouncementListPage;
