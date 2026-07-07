import Link from "next/link";

type Announcement = {
  id: number;
  title: string;
  description?: string;
  classId: string | null;
  date: Date;
};

const Announcements = ({ data }: { data?: Announcement[] }) => {
  const hasData = data && data.length > 0;

  const staticAnnouncements = [
    {
      id: 1,
      title: "Horarios del Ciclo 2026",
      date: new Date("2026-06-18"),
      content: "Ya están disponibles los nuevos horarios para los cursos grupales e intensivos de Francés y Chino.",
    },
    {
      id: 2,
      title: "Certificaciones Cambridge",
      date: new Date("2026-06-15"),
      content: "Las inscripciones para la ronda de exámenes de certificación FCE y CAE cierran este fin de mes.",
    },
    {
      id: 3,
      title: "Descuento de Apertura",
      date: new Date("2026-06-12"),
      content: "Aprovecha un 15% de descuento en la matrícula de inscripción temprana para el nuevo curso de Alemán.",
    },
  ];

  const list = hasData
    ? data.map((item) => ({
        id: item.id,
        title: item.title,
        date: item.date,
        content: item.description || "Sin descripción.",
      }))
    : staticAnnouncements;

  const bgClasses = [
    "bg-lamaSkyLight",
    "bg-lamaPurpleLight",
    "bg-lamaYellowLight",
  ];

  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Anuncios</h1>
        <Link href="/list/announcements" className="text-xs text-gray-400 font-semibold hover:text-[#2E4068] transition-colors cursor-pointer">
          Ver todo
        </Link>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {list.slice(0, 3).map((item, idx) => (
          <div
            key={item.id}
            className={`${bgClasses[idx % bgClasses.length]} rounded-md p-4`}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm text-gray-800">{item.title}</h2>
              <span className="text-[10px] text-gray-400 bg-white rounded-md px-2 py-1 shadow-sm font-semibold font-mono">
                {new Date(item.date).toLocaleDateString("es-MX")}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              {item.content}
            </p>
          </div>
        ))}
        {list.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">No hay anuncios registrados.</p>
        )}
      </div>
    </div>
  );
};

export default Announcements;
