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

type Lead = {
  id: number;
  matricula: string | null;
  name: string;
  language: string | null;
  level: string | null;
  age: string | null;
  phone: string | null;
  contactMethod: string | null;
  leadDate: Date | null;
  sampleClassDate: Date | null;
  status: string;
  notes: string | null;
};

const columns = [
  {
    header: "Matrícula",
    accessor: "matricula",
    className: "hidden md:table-cell px-2 w-20 min-w-[80px] max-w-[80px]",
  },
  {
    header: "Nombre",
    accessor: "name",
    className: "px-2",
  },
  {
    header: "Idioma",
    accessor: "language",
    className: "hidden lg:table-cell px-2 w-28",
  },
  {
    header: "Nivel",
    accessor: "level",
    className: "hidden lg:table-cell px-2 w-24",
  },
  {
    header: "Teléfono",
    accessor: "phone",
    className: "hidden xl:table-cell px-2 w-36",
  },
  {
    header: "Canal",
    accessor: "contactMethod",
    className: "hidden xl:table-cell px-2 w-28",
  },
  {
    header: "Clase Muestra",
    accessor: "sampleClassDate",
    className: "hidden xl:table-cell px-2 w-36",
  },
  {
    header: "Estatus",
    accessor: "status",
    className: "px-2 w-32",
  },
  {
    header: "Acciones",
    accessor: "action",
    className: "px-2 w-28",
  },
];

const LeadListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { role } = await getSession();
  const { search, status, language, sort, page } = searchParams;
  const p = page ? parseInt(page, 10) : 1;
  const ITEM_LIMIT = 10;

  // Build prisma query where clause
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
      { matricula: { contains: search } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (language) {
    where.language = language;
  }

  // Build prisma query orderBy clause
  let orderBy: any = { id: "desc" }; // default order
  if (sort) {
    const [field, order] = sort.split("-");
    if (field && (order === "asc" || order === "desc")) {
      orderBy = { [field]: order };
    }
  }

  // Fetch leads data with filter/sort/pagination applied
  const [leadsData, count, exportData] = await prisma.$transaction([
    prisma.lead.findMany({
      where,
      orderBy,
      skip: ITEM_LIMIT * (p - 1),
      take: ITEM_LIMIT,
    }),
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy,
    }),
  ]);

  // Query unique languages that actually exist in Leads database
  const uniqueLanguagesRaw = await prisma.lead.findMany({
    select: { language: true },
    where: { language: { not: null } },
    distinct: ["language"],
  });

  const languageOptions = uniqueLanguagesRaw
    .map((l) => l.language as string)
    .filter(Boolean)
    .sort()
    .map((lang) => ({ label: lang, value: lang }));

  const filterOptions = [
    {
      label: "Estatus",
      paramName: "status",
      options: [
        { label: "NUEVO", value: "NUEVO" },
        { label: "CONTACTADO", value: "CONTACTADO" },
        { label: "CLASE_MUESTRA", value: "CLASE_MUESTRA" },
        { label: "LISTA_ESPERA", value: "LISTA_ESPERA" },
        { label: "INSCRITO", value: "INSCRITO" },
        { label: "NO_INTERESADO", value: "NO_INTERESADO" },
      ],
    },
    {
      label: "Idioma",
      paramName: "language",
      options: languageOptions,
    },
  ];

  const sortOptions = [
    { label: "Fecha de Captación (Más reciente)", value: "leadDate-desc" },
    { label: "Fecha de Captación (Más antiguo)", value: "leadDate-asc" },
    { label: "Nombre (A-Z)", value: "name-asc" },
    { label: "Nombre (Z-A)", value: "name-desc" },
    { label: "Matrícula (A-Z)", value: "matricula-asc" },
    { label: "Matrícula (Z-A)", value: "matricula-desc" },
  ];

  const serializedLeadsForExport = exportData.map((item) => ({
    matricula: item.matricula || "-",
    name: item.name,
    language: item.language || "-",
    level: item.level || "-",
    age: item.age || "-",
    phone: item.phone || "-",
    contactMethod: item.contactMethod || "-",
    leadDateStr: item.leadDate ? new Date(item.leadDate).toLocaleDateString("es-MX") : "-",
    sampleClassDateStr: item.sampleClassDate ? new Date(item.sampleClassDate).toLocaleDateString("es-MX") : "-",
    status: item.status,
    notes: item.notes || "-",
  }));

  const exportColumns = [
    { header: "Matrícula", key: "matricula" },
    { header: "Nombre", key: "name" },
    { header: "Idioma", key: "language" },
    { header: "Nivel", key: "level" },
    { header: "Edad", key: "age" },
    { header: "Teléfono", key: "phone" },
    { header: "Canal de Contacto", key: "contactMethod" },
    { header: "Fecha de Captación", key: "leadDateStr" },
    { header: "Fecha Clase Muestra", key: "sampleClassDateStr" },
    { header: "Estatus", key: "status" },
    { header: "Notas", key: "notes" },
  ];

  const renderRow = (item: Lead) => {
    let statusColor = "bg-gray-100 text-gray-800";
    if (item.status === "INSCRITO") statusColor = "bg-green-100 text-green-800";
    if (item.status === "NUEVO") statusColor = "bg-blue-100 text-blue-800";
    if (item.status === "CLASE_MUESTRA") statusColor = "bg-orange-100 text-orange-800";
    if (item.status === "LISTA_ESPERA") statusColor = "bg-yellow-100 text-yellow-800";
    if (item.status === "NO_INTERESADO") statusColor = "bg-red-100 text-red-800 font-light opacity-80";
    if (item.status === "CONTACTADO") statusColor = "bg-purple-100 text-purple-800";

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="hidden md:table-cell px-2 py-3 font-mono text-xs text-gray-500 w-20 min-w-[80px] max-w-[80px]">
          {item.matricula || "-"}
        </td>
        <td className="px-2 py-3">
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{item.name}</span>
            {item.notes && (
              <span className="text-xs text-gray-400 italic max-w-[200px] truncate" title={item.notes}>
                {item.notes}
              </span>
            )}
          </div>
        </td>
        <td className="hidden lg:table-cell px-2 py-3 w-28">{item.language || "-"}</td>
        <td className="hidden lg:table-cell px-2 py-3 font-mono text-xs w-24">{item.level || "-"}</td>
        <td className="hidden xl:table-cell px-2 py-3 w-36">
          {item.phone ? (
            <a href={`tel:${item.phone}`} className="hover:underline hover:text-vocaliBlue">
              {item.phone}
            </a>
          ) : (
            "-"
          )}
        </td>
        <td className="hidden xl:table-cell px-2 py-3 capitalize text-xs text-gray-500 w-28">
          {item.contactMethod || "-"}
        </td>
        <td className="hidden xl:table-cell px-2 py-3 text-xs w-36">
          {item.sampleClassDate ? new Date(item.sampleClassDate).toLocaleDateString("es-MX") : "-"}
        </td>
        <td className="px-2 py-3 w-32">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${statusColor}`}>
            {item.status}
          </span>
        </td>
        <td className="px-2 py-3 w-28">
          <div className="flex items-center gap-2">
            {(role === "admin" || role === "teacher") && (
              <>
                <FormModal table="lead" type="update" data={item} />
                <FormModal table="lead" type="delete" id={item.id} />
                
                {/* Convert to Student Action Button */}
                {item.status !== "INSCRITO" && (
                  <FormModal 
                    table="student" 
                    type="create" 
                    data={{
                      firstName: item.name.split(" ")[0] || "",
                      lastName: item.name.split(" ").slice(1).join(" ") || "",
                      phone: item.phone || "",
                      username: item.matricula ? item.matricula.toLowerCase() : `alumni_${item.id}`,
                      email: item.phone ? `${item.phone}@vocali.com` : `lead_${item.id}@vocali.com`,
                    }} 
                  />
                )}
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
        <h1 className="hidden md:block text-lg font-semibold">Registro de Prospectos (Leads)</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <ListHeaderToolbar
            placeholder="Buscar prospecto..."
            filterOptions={filterOptions}
            sortOptions={sortOptions}
          />
          <div className="flex items-center gap-4 self-end">
            <ExportButton
              data={serializedLeadsForExport}
              filename="Prospectos_Vocali.csv"
              columns={exportColumns}
            />
            {(role === "admin" || role === "teacher") && (
              <FormModal table="lead" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <div className="overflow-x-auto w-full">
        <Table columns={columns} renderRow={renderRow} data={leadsData} />
      </div>
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default LeadListPage;
