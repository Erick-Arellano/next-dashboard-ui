export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import CalendarClient from "@/components/CalendarClient";

export default async function GeneralCalendarPage() {
  // Fetch payments with student details
  const payments = await prisma.payment.findMany({
    include: {
      student: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Fetch leads with sample classes scheduled
  const leads = await prisma.lead.findMany({
    where: {
      sampleClassDate: {
        not: null,
      },
    },
  });

  // Fetch general school events
  const events = await prisma.event.findMany();

  // Fetch exams with class, subject, and teacher
  const exams = await prisma.exam.findMany({
    include: {
      subject: { select: { name: true } },
      class: { select: { name: true } },
      teacher: { select: { name: true } },
    },
  });

  // Fetch all lessons/schedules with relational info
  const lessons = await prisma.lesson.findMany({
    include: {
      subject: { select: { name: true } },
      class: { select: { name: true, grade: true } },
      teacher: { select: { name: true } },
    },
  });

  return (
    <div className="bg-slate-50 p-4 min-h-screen flex flex-col gap-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Calendario General Unificado</h1>
        <p className="text-xs text-gray-500 font-semibold">
          Vista consolida de Finanzas, CRM de Prospectos, Horarios y Actividades
        </p>
      </div>

      {/* INTERACTIVE CALENDAR CONTAINER */}
      <CalendarClient
        payments={payments}
        leads={leads}
        events={events}
        exams={exams}
        lessons={lessons}
      />
    </div>
  );
}
