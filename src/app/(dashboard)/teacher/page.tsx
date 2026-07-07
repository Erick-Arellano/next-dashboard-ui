import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import BigCalendar from "@/components/BigCalender";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TeacherPage({
  searchParams,
}: {
  searchParams: { simulateId?: string };
}) {
  const { role, teacherId: sessionTeacherId } = await getSession();

  // Determine active teacher ID (session or admin simulation query param)
  let activeTeacherId = sessionTeacherId;
  const isSimulation = role === "admin" && searchParams.simulateId;
  
  if (role === "admin") {
    activeTeacherId = searchParams.simulateId || null;
  }

  // Fetch list of teachers for admin simulation selection
  const teachers = await prisma.teacher.findMany({
    orderBy: { name: "asc" },
  });

  // If no teacher is logged in or simulated, and the user is admin:
  // Render a dashboard to select a teacher to simulate.
  if (!activeTeacherId) {
    return (
      <div className="flex-1 p-6 bg-slate-50 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h1 className="text-2xl font-black text-[#2E4068]">Panel del Profesor</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Por favor, selecciona un profesor para visualizar o simular su panel de trabajo escolar.
          </p>

          <div className="mt-6 max-w-md">
            <label className="text-xs text-gray-500 font-bold block mb-2">Simular Profesor:</label>
            <form method="GET" action="/teacher" className="flex gap-2">
              <select
                name="simulateId"
                defaultValue=""
                className="ring-[1.5px] ring-gray-300 p-2.5 rounded-xl text-sm w-full bg-white font-sans focus:outline-none focus:ring-2 focus:ring-[#2E4068]"
              >
                <option value="" disabled>Selecciona un profesor...</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.id})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="bg-[#2E4068] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-opacity-95 transition-all duration-200 cursor-pointer"
              >
                Simular
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Fetch teacher details with classes
  const teacher = await prisma.teacher.findUnique({
    where: { id: activeTeacherId },
    include: {
      classes: {
        include: {
          _count: {
            select: { students: true },
          },
        },
      },
      lessons: {
        include: {
          class: {
            include: {
              _count: {
                select: { students: true },
              },
            },
          },
          subject: { select: { name: true } },
        },
      },
    },
  });

  // Get all unique classes taught or supervised by this teacher
  const uniqueClassesMap = new Map<string, any>();
  
  if (teacher) {
    // Add supervised classes
    teacher.classes.forEach((cls) => {
      uniqueClassesMap.set(cls.id, {
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        studentsCount: cls._count.students,
      });
    });
    
    // Add classes from lessons
    teacher.lessons.forEach((l) => {
      if (l.class && !uniqueClassesMap.has(l.class.id)) {
        uniqueClassesMap.set(l.class.id, {
          id: l.class.id,
          name: l.class.name,
          grade: l.class.grade,
          studentsCount: l.class._count?.students || 0,
        });
      }
    });
  }

  const teacherClasses = Array.from(uniqueClassesMap.values());

  if (!teacher) {
    return (
      <div className="flex-1 p-6 bg-slate-50">
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm font-semibold">
          Error: Profesor no encontrado.
        </div>
      </div>
    );
  }

  // Map day strings to week numbers (Sunday=0, Monday=1, etc.)
  const mapDayToNumber = (day: string | null) => {
    if (!day) return 1;
    const days: { [key: string]: number } = {
      lunes: 1,
      martes: 2,
      miercoles: 3,
      miércoles: 3,
      jueves: 4,
      viernes: 5,
      sabado: 6,
      sábado: 6,
      domingo: 0,
    };
    return days[day.toLowerCase()] ?? 1;
  };

  // Generate calendar events based on sqlite lessons
  const calendarEventsList = teacher.lessons.map((l) => {
    const dayNum = mapDayToNumber(l.dayOfWeek);
    
    // Find date for the corresponding day of current week
    const today = new Date();
    const currentDay = today.getDay();
    const diff = dayNum - currentDay;
    const eventDate = new Date(today);
    eventDate.setDate(today.getDate() + diff);

    const [startH, startM] = (l.startTime || "09:00").split(":").map(Number);
    const [endH, endM] = (l.endTime || "10:00").split(":").map(Number);

    const start = new Date(eventDate);
    start.setHours(startH, startM, 0, 0);

    const end = new Date(eventDate);
    end.setHours(endH, endM, 0, 0);

    return {
      title: `${l.subject.name} - ${l.class.name}`,
      start,
      end,
    };
  });

  return (
    <div className="flex-1 p-6 bg-slate-50 flex flex-col gap-6">
      
      {/* SIMULATION INDICATOR & SELECTOR FOR ADMINS */}
      {role === "admin" && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-xs font-black text-amber-800 uppercase tracking-wide">
              Vista Simulación Administrador: {teacher.name} ({teacher.id})
            </span>
          </div>
          <form method="GET" action="/teacher" className="flex gap-2">
            <select
              name="simulateId"
              defaultValue={activeTeacherId}
              className="ring-[1px] ring-amber-300 p-1.5 rounded-lg text-xs bg-white font-sans focus:outline-none"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.id})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer"
            >
              Cambiar
            </button>
            <Link 
              href="/teacher"
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all duration-200"
            >
              Salir Vista
            </Link>
          </form>
        </div>
      )}

      {/* HEADER CARD */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#2E4068]">Hola, {teacher.name}</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Bienvenido a tu portal. Aquí puedes revisar tus clases asignadas y capturar las evaluaciones/boletines.
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-xs font-black uppercase">
          Estatus: Activo
        </div>
      </div>

      {/* WORKSPACE SECTIONS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT: MY GROUPS LIST */}
        <div className="xl:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 h-fit">
          <h2 className="text-base font-black text-[#2E4068] uppercase tracking-wider border-b border-slate-100 pb-2">
            Mis Cursos y Grupos
          </h2>
          
          {teacherClasses.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No tienes grupos supervisados o asignados en el sistema.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {teacherClasses.map((cls) => (
                <div 
                  key={cls.id}
                  className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between hover:bg-[#E4ECFA]/20 transition-all duration-200"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-[#2E4068]">{cls.name}</span>
                    <span className="text-[10px] text-slate-400 font-semibold font-mono">Nivel {cls.grade}</span>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className="text-[10px] text-slate-500 font-bold">{cls.studentsCount} Alumnos</span>
                    <Link
                      href={`/teacher/evaluate/${cls.id}`}
                      className="bg-[#F04F23] hover:bg-opacity-95 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 shadow-sm"
                    >
                      Evaluar Alumnos
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CONTACT BOX */}
          <div className="bg-[#E4ECFA]/15 border border-[#E4ECFA] p-5 rounded-2xl flex flex-col gap-3.5 mt-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#E4ECFA] flex items-center justify-center text-[#2E4068]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
              </div>
              <h3 className="font-black text-sm text-[#2E4068]">Soporte y Dirección</h3>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Si necesitas reportar algún incidente, solicitar cambios de horarios o comunicarte con administración:
            </p>
            <a
              href="https://wa.me/5211234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-opacity-95 text-white py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.37 5.378 0 12.003 0a11.948 11.948 0 0 1 8.5 3.5 11.95 11.95 0 0 1 3.5 8.5c-.003 6.63-5.378 12-12.003 12-2.002-.001-3.973-.5-5.73-1.451L0 24zm6.59-4.877c1.616.96 3.2 1.489 4.882 1.49 5.27.003 9.563-4.287 9.565-9.564a9.508 9.508 0 0 0-2.8-6.77 9.53 9.53 0 0 0-6.77-2.8c-5.27 0-9.56 4.287-9.563 9.565-.002 1.776.49 3.51 1.47 5.016L1.892 22.18l6.162-1.618z" />
              </svg>
              Enviar WhatsApp a Dirección
            </a>
          </div>
        </div>

        {/* RIGHT: WEEK CALENDAR */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <h2 className="text-base font-black text-[#2E4068] uppercase tracking-wider border-b border-slate-100 pb-2">
            Horario Semanal
          </h2>
          <div className="h-[450px]">
            <BigCalendar events={calendarEventsList} />
          </div>
        </div>

      </div>

    </div>
  );
}
