export interface DBLesson {
  id: number;
  subject: { name: string };
  class: { name: string };
  teacher: { name: string };
  dayOfWeek: string | null;
  startTime: string | null;
  endTime: string | null;
}

export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
}

export function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to get Monday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getDayOffset(dayName: string): number {
  switch (dayName.trim().toLowerCase()) {
    case "lunes": return 0;
    case "martes": return 1;
    case "miercoles":
    case "miércoles": return 2;
    case "jueves": return 3;
    case "viernes": return 4;
    case "sabado":
    case "sábado": return 5;
    case "domingo": return 6;
    default: return 0;
  }
}

export function mapLessonsToEvents(lessons: DBLesson[], referenceDate = new Date()): CalendarEvent[] {
  const monday = getMonday(referenceDate);
  const events: CalendarEvent[] = [];

  for (const lesson of lessons) {
    if (!lesson.dayOfWeek || !lesson.startTime || !lesson.endTime) {
      continue;
    }

    const dayOffset = getDayOffset(lesson.dayOfWeek);
    const eventDate = new Date(monday);
    eventDate.setDate(monday.getDate() + dayOffset);

    const [startH, startM] = lesson.startTime.split(":").map(Number);
    const start = new Date(eventDate);
    start.setHours(startH, startM, 0, 0);

    const [endH, endM] = lesson.endTime.split(":").map(Number);
    const end = new Date(eventDate);
    end.setHours(endH, endM, 0, 0);

    events.push({
      title: `${lesson.subject.name} - ${lesson.class.name}`,
      start,
      end,
      allDay: false,
      resource: {
        type: "lesson",
        id: lesson.id,
        lesson,
      },
    });
  }

  return events;
}
