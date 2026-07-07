"use client";

import React, { useState, useMemo } from "react";
import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Link from "next/link";
import Image from "next/image";

moment.locale("es");
const localizer = momentLocalizer(moment);

const messages = {
  allDay: "Todo el día",
  previous: "Anterior",
  next: "Siguiente",
  today: "Hoy",
  month: "Mes",
  week: "Semana",
  work_week: "Semana Laboral",
  day: "Día",
  agenda: "Agenda",
  date: "Fecha",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "No hay eventos en este rango",
  showMore: (total: number) => `+ Ver más (${total})`,
};

function getDayOfWeekName(date: Date): string {
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return days[date.getDay()];
}

interface CalendarClientProps {
  payments: any[];
  leads: any[];
  events: any[];
  exams: any[];
  lessons: any[];
}

export default function CalendarClient({
  payments,
  leads,
  events: dbEvents,
  exams,
  lessons,
}: CalendarClientProps) {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());

  // Filter States
  const [filterPayments, setFilterPayments] = useState(true);
  const [filterLeads, setFilterLeads] = useState(true);
  const [filterLessons, setFilterLessons] = useState(false); // default off to prevent clutter
  const [filterEventsExams, setFilterEventsExams] = useState(true);

  // Selected Event Modal State
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  // Visible Range State
  const [viewStart, setViewStart] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() - 1, 1);
  });
  const [viewEnd, setViewEnd] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 2, 0);
  });

  const handleRangeChange = (range: any) => {
    if (Array.isArray(range)) {
      if (range.length > 0) {
        setViewStart(new Date(range[0]));
        setViewEnd(new Date(range[range.length - 1]));
      }
    } else if (range && range.start && range.end) {
      setViewStart(new Date(range.start));
      setViewEnd(new Date(range.end));
    }
  };

  // Compile and Filter Calendar Events
  const calendarEvents = useMemo(() => {
    const list: any[] = [];

    // 1. Payments (Colegiaturas)
    if (filterPayments) {
      for (const p of payments) {
        const dueDate = new Date(p.dueDate);
        const start = new Date(dueDate);
        start.setHours(9, 0, 0, 0);
        const end = new Date(dueDate);
        end.setHours(10, 0, 0, 0);

        list.push({
          title: `💸 $${p.amount} - ${p.student?.name || "Alumno"} (${p.status})`,
          start,
          end,
          allDay: false,
          resource: {
            type: "payment",
            data: p,
          },
        });
      }
    }

    // 2. Leads (Clases Muestra)
    if (filterLeads) {
      for (const l of leads) {
        if (!l.sampleClassDate) continue;
        const sDate = new Date(l.sampleClassDate);
        const start = new Date(sDate);
        const end = new Date(sDate.getTime() + 60 * 60 * 1000); // 1 hour duration

        list.push({
          title: `🙋 Muestra: ${l.name} (${l.language || "Idioma"})`,
          start,
          end,
          allDay: false,
          resource: {
            type: "lead",
            data: l,
          },
        });
      }
    }

    // 3. School Events & Exams
    if (filterEventsExams) {
      // General Events
      for (const ev of dbEvents) {
        const evDate = new Date(ev.date);
        const start = new Date(evDate);
        if (ev.startTime) {
          const [sh, sm] = ev.startTime.split(":").map(Number);
          start.setHours(sh, sm, 0, 0);
        } else {
          start.setHours(9, 0, 0, 0);
        }

        const end = new Date(evDate);
        if (ev.endTime) {
          const [eh, em] = ev.endTime.split(":").map(Number);
          end.setHours(eh, em, 0, 0);
        } else {
          end.setHours(10, 0, 0, 0);
        }

        list.push({
          title: `🎉 Evento: ${ev.title}`,
          start,
          end,
          allDay: false,
          resource: {
            type: "event",
            data: ev,
          },
        });
      }

      // Exams
      for (const ex of exams) {
        const exDate = new Date(ex.date);
        const start = new Date(exDate);
        start.setHours(10, 0, 0, 0);
        const end = new Date(exDate);
        end.setHours(11, 30, 0, 0); // 1.5 hours duration

        list.push({
          title: `📝 Examen: ${ex.subject?.name || "Curso"} - ${ex.class?.name || "Grupo"}`,
          start,
          end,
          allDay: false,
          resource: {
            type: "exam",
            data: ex,
          },
        });
      }
    }

    // 4. Lessons (Horarios - Projected Weekly Recurring)
    if (filterLessons && viewStart && viewEnd) {
      const current = new Date(viewStart);
      // Project day by day in range
      while (current <= viewEnd) {
        const dayName = getDayOfWeekName(current);
        const dayLessons = lessons.filter((l) => l.dayOfWeek === dayName);

        for (const l of dayLessons) {
          const start = new Date(current);
          const [sh, sm] = (l.startTime || "08:00").split(":").map(Number);
          start.setHours(sh, sm, 0, 0);

          const end = new Date(current);
          const [eh, em] = (l.endTime || "08:45").split(":").map(Number);
          end.setHours(eh, em, 0, 0);

          list.push({
            title: `📚 ${l.subject?.name || "Curso"} - ${l.class?.name || "Grupo"}`,
            start,
            end,
            allDay: false,
            resource: {
              type: "lesson",
              data: l,
            },
          });
        }
        current.setDate(current.getDate() + 1);
      }
    }

    return list;
  }, [
    payments,
    leads,
    dbEvents,
    exams,
    lessons,
    filterPayments,
    filterLeads,
    filterLessons,
    filterEventsExams,
    viewStart,
    viewEnd,
  ]);

  // Set colors based on resource type
  const eventStyleGetter = (event: any) => {
    let backgroundColor = "#1872D9"; // default Vocali blue

    if (event.resource) {
      const type = event.resource.type;
      if (type === "payment") {
        const status = event.resource.data.status;
        if (status === "Pagado") backgroundColor = "#10B981"; // emerald green
        else if (status === "Pendiente") backgroundColor = "#F59E0B"; // amber yellow
        else backgroundColor = "#EF4444"; // red
      } else if (type === "lead") {
        backgroundColor = "#F47A20"; // Vocali orange
      } else if (type === "event") {
        backgroundColor = "#8B5CF6"; // purple
      } else if (type === "exam") {
        backgroundColor = "#6366F1"; // indigo
      } else if (type === "lesson") {
        backgroundColor = "#3B82F6"; // sky blue
      }
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "6px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
        fontSize: "12px",
        padding: "2px 6px",
      },
    };
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* FILTER PANEL */}
      <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 flex flex-wrap gap-6 items-center justify-between">
        <h1 className="text-md font-semibold text-gray-700">Filtros del Calendario:</h1>
        <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-600">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterPayments}
              onChange={(e) => setFilterPayments(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 border-gray-300 focus:ring-emerald-500"
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Colegiaturas/Vencimientos
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterLeads}
              onChange={(e) => setFilterLeads(e.target.checked)}
              className="w-4 h-4 rounded text-orange-500 border-gray-300 focus:ring-orange-500"
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              Clases Muestra (Prospectos)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterEventsExams}
              onChange={(e) => setFilterEventsExams(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-500 border-gray-300 focus:ring-indigo-500"
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              Eventos / Exámenes
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterLessons}
              onChange={(e) => setFilterLessons(e.target.checked)}
              className="w-4 h-4 rounded text-blue-500 border-gray-300 focus:ring-blue-500"
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              Horario Escolar (Lecciones)
            </span>
          </label>
        </div>
      </div>

      {/* CALENDAR */}
      <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 flex-1 min-h-[600px] h-[750px]">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          views={["month", "week", "day", "agenda"]}
          view={view}
          date={date}
          onView={(v) => setView(v)}
          onNavigate={(d) => setDate(d)}
          onRangeChange={handleRangeChange}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          style={{ height: "100%" }}
          messages={messages}
          culture="es"
          popup={true}
        />
      </div>

      {/* DETAIL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg relative border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <Image src="/close.png" alt="Cerrar" width={16} height={16} />
            </button>

            {/* Header / Icon */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">
                {selectedEvent.resource.type === "payment" && "💸"}
                {selectedEvent.resource.type === "lead" && "🙋"}
                {selectedEvent.resource.type === "event" && "🎉"}
                {selectedEvent.resource.type === "exam" && "📝"}
                {selectedEvent.resource.type === "lesson" && "📚"}
              </span>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {selectedEvent.resource.type === "payment" && "Vencimiento de Colegatura"}
                  {selectedEvent.resource.type === "lead" && "Clase Muestra Programada"}
                  {selectedEvent.resource.type === "event" && "Evento General"}
                  {selectedEvent.resource.type === "exam" && "Examen de Curso"}
                  {selectedEvent.resource.type === "lesson" && "Clase Programada"}
                </h2>
                <p className="text-xs text-gray-400 font-semibold capitalize">
                  {moment(selectedEvent.start).format("dddd, D [de] MMMM [a las] HH:mm [hrs]")}
                </p>
              </div>
            </div>

            {/* Event Content */}
            <div className="bg-gray-50 p-4 rounded-md mb-6 border border-gray-100 text-sm text-gray-700 space-y-2.5">
              <p>
                <strong className="text-gray-500 block text-xs">Título / Resumen:</strong>
                <span className="font-semibold text-gray-800">{selectedEvent.title}</span>
              </p>

              {/* Payment Details */}
              {selectedEvent.resource.type === "payment" && (
                <>
                  <p>
                    <strong className="text-gray-500 block text-xs">Alumno:</strong>
                    <span className="font-medium text-gray-800">{selectedEvent.resource.data.student?.name} ({selectedEvent.resource.data.studentId})</span>
                  </p>
                  <p>
                    <strong className="text-gray-500 block text-xs">Monto:</strong>
                    <span className="font-bold text-emerald-600">${selectedEvent.resource.data.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                  </p>
                  <p>
                    <strong className="text-gray-500 block text-xs">Estatus de Cobro:</strong>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${
                        selectedEvent.resource.data.status === "Pagado"
                          ? "bg-emerald-500"
                          : selectedEvent.resource.data.status === "Pendiente"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                    >
                      {selectedEvent.resource.data.status}
                    </span>
                  </p>
                </>
              )}

              {/* Lead Details */}
              {selectedEvent.resource.type === "lead" && (
                <>
                  <p>
                    <strong className="text-gray-500 block text-xs">Prospecto:</strong>
                    <span className="font-medium text-gray-800">{selectedEvent.resource.data.name}</span>
                  </p>
                  <p>
                    <strong className="text-gray-500 block text-xs">Contacto (Tel):</strong>
                    <span className="font-medium text-gray-800">{selectedEvent.resource.data.phone || "No registrado"}</span>
                  </p>
                  <p>
                    <strong className="text-gray-500 block text-xs">Idioma e Interés:</strong>
                    <span className="font-medium text-gray-800">
                      {selectedEvent.resource.data.language} - Nivel {selectedEvent.resource.data.level || "N/A"} ({selectedEvent.resource.data.age || "Edad N/A"})
                    </span>
                  </p>
                  {selectedEvent.resource.data.notes && (
                    <p>
                      <strong className="text-gray-500 block text-xs">Notas:</strong>
                      <span className="italic text-gray-600 text-xs block bg-white p-2 rounded border border-gray-100 mt-1 max-h-[80px] overflow-y-auto">
                        &quot;{selectedEvent.resource.data.notes}&quot;
                      </span>
                    </p>
                  )}
                </>
              )}

              {/* Lesson Details */}
              {selectedEvent.resource.type === "lesson" && (
                <>
                  <p>
                    <strong className="text-gray-500 block text-xs">Curso / Idioma:</strong>
                    <span className="font-medium text-gray-800">{selectedEvent.resource.data.subject?.name}</span>
                  </p>
                  <p>
                    <strong className="text-gray-500 block text-xs">Grupo:</strong>
                    <span className="font-medium text-gray-800">Nivel {selectedEvent.resource.data.class?.grade} - {selectedEvent.resource.data.class?.name}</span>
                  </p>
                  <p>
                    <strong className="text-gray-500 block text-xs">Profesor:</strong>
                    <span className="font-medium text-gray-800">{selectedEvent.resource.data.teacher?.name}</span>
                  </p>
                </>
              )}

              {/* Exam Details */}
              {selectedEvent.resource.type === "exam" && (
                <>
                  <p>
                    <strong className="text-gray-500 block text-xs">Grupo asignado:</strong>
                    <span className="font-medium text-gray-800">{selectedEvent.resource.data.class?.name}</span>
                  </p>
                  <p>
                    <strong className="text-gray-500 block text-xs">Profesor que aplica:</strong>
                    <span className="font-medium text-gray-800">{selectedEvent.resource.data.teacher?.name}</span>
                  </p>
                </>
              )}
            </div>

            {/* Actions / Navigation Buttons */}
            <div className="flex gap-3 justify-end text-xs font-semibold">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-md transition"
              >
                Cerrar
              </button>

              {/* Navigation Link for Student */}
              {selectedEvent.resource.type === "payment" && (
                <Link
                  href={`/list/students/${selectedEvent.resource.data.studentId}`}
                  className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition flex items-center gap-1.5"
                  onClick={() => setSelectedEvent(null)}
                >
                  Ver Ficha Alumno
                </Link>
              )}

              {/* Navigation Link for Lead */}
              {selectedEvent.resource.type === "lead" && (
                <Link
                  href={`/list/prospects?search=${encodeURIComponent(selectedEvent.resource.data.name)}`}
                  className="px-4 py-2 text-white bg-orange-500 hover:bg-orange-600 rounded-md transition flex items-center gap-1.5"
                  onClick={() => setSelectedEvent(null)}
                >
                  Ver en CRM
                </Link>
              )}

              {/* Navigation Link for Teacher */}
              {selectedEvent.resource.type === "lesson" && (
                <Link
                  href={`/list/teachers/${selectedEvent.resource.data.teacherId}`}
                  className="px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md transition flex items-center gap-1.5"
                  onClick={() => setSelectedEvent(null)}
                >
                  Ficha Profesor
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
