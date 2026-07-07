export const dynamic = "force-dynamic";

import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalender";
import FormModal from "@/components/FormModal";
import TeacherPayrollSummary from "@/components/TeacherPayrollSummary";
import Performance from "@/components/Performance";
import { role } from "@/lib/data";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { mapLessonsToEvents } from "@/lib/calendarHelpers";

const SingleTeacherPage = async ({
  params,
}: {
  params: { id: string };
}) => {
  const teacher = await prisma.teacher.findUnique({
    where: { id: params.id },
    include: {
      subjects: true,
      classes: true,
      _count: {
        select: {
          lessons: true,
        },
      },
    },
  });

  if (!teacher) {
    return notFound();
  }

  // 1. Fetch Lessons
  const lessons = await prisma.lesson.findMany({
    where: { teacherId: params.id },
    include: {
      subject: { select: { name: true } },
      class: { select: { name: true } },
      teacher: { select: { name: true } },
    },
  });

  const calendarEvents = mapLessonsToEvents(lessons);

  // 2. Fetch Teacher Payments / Payroll Summary
  const teacherPayments = await prisma.teacherPayment.findMany({
    where: { teacherId: params.id },
    orderBy: { paymentDate: "desc" },
  });
  const pendingPayments = teacherPayments.filter((p) => p.status === "Pendiente");
  const pendingHours = pendingPayments.reduce((sum, p) => sum + p.hours, 0);
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  const lastPayment = teacherPayments.find((p) => p.status === "Pagado");
  const lastPaymentAmount = lastPayment ? lastPayment.amount : null;
  const lastPaymentDate = lastPayment ? lastPayment.paymentDate : null;

  // 3. Fetch Announcements
  const announcements = await prisma.announcement.findMany({
    where: {
      OR: [
        { classId: { in: teacher.classes.map((c) => c.id) } },
        { classId: null }
      ]
    },
    orderBy: { date: "desc" },
    take: 3,
  });

  // 4. Fetch Teacher Evaluations Average
  const averageEvaluationResult = await prisma.evaluation.aggregate({
    where: { teacherId: params.id },
    _avg: { q11_global: true },
  });
  const averageEvaluation = averageEvaluationResult._avg.q11_global !== null ? averageEvaluationResult._avg.q11_global : null;

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      {/* BACK LINK */}
      <div className="flex items-center">
        <Link 
          href="/list/teachers" 
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-vocaliBlue transition-all duration-200 bg-white px-3 py-1.5 rounded-md border border-gray-150 shadow-sm font-semibold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Volver a la lista de Profesores
        </Link>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        {/* LEFT */}
        <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-1/3">
              <Image
                src={teacher.photo || "/avatar.png"}
                alt=""
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover shadow-md"
              />
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-gray-800">{teacher.name}</h1>
                {role === "admin" && (
                  <FormModal
                    table="teacher"
                    type="update"
                    data={{
                      id: teacher.id,
                      name: teacher.name,
                      email: teacher.email || "",
                      phone: teacher.phone || "",
                      address: teacher.address || "",
                      img: teacher.photo || "/avatar.png",
                      subjects: teacher.subjects,
                      classes: teacher.classes,
                    }}
                  />
                )}
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Profesor de idiomas especializado en la enseñanza formativa en Vocali.
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium text-gray-600">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>{teacher.email || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{teacher.phone || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/address.png" alt="" width={14} height={14} />
                  <span className="truncate max-w-[150px]">{teacher.address || "-"}</span>
                </div>
              </div>
            </div>
          </div>
          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%] shadow-sm border border-gray-100">
              <Image
                src="/singleBranch.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold text-gray-800">{teacher.subjects.length}</h1>
                <span className="text-sm text-gray-400 font-medium">Nivel</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%] shadow-sm border border-gray-100">
              <Image
                src="/singleLesson.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold text-gray-800">{teacher._count.lessons}</h1>
                <span className="text-sm text-gray-400 font-medium">Cursos</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%] shadow-sm border border-gray-100">
              <Image
                src="/singleClass.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold text-gray-800">{teacher.classes.length}</h1>
                <span className="text-sm text-gray-400 font-medium">Grupos</span>
              </div>
            </div>
          </div>
        </div>
        {/* BOTTOM */}
        <div className="mt-4 bg-white rounded-md p-4 h-[650px] shadow-sm border border-gray-100 flex flex-col">
          <h1 className="text-lg font-semibold text-gray-800 mb-4 flex-shrink-0">Horario del Profesor</h1>
          <div className="flex-1 min-h-0">
            <BigCalendar events={calendarEvents} />
          </div>
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
          <h1 className="text-lg font-semibold text-gray-800">Accesos Rápidos</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            <Link className="p-3 rounded-md bg-lamaSkyLight hover:bg-lamaSky hover:text-white transition-all duration-200 font-semibold text-sky-800" href={`/list/classes?supervisorId=${teacher.id}`}>
              Grupos
            </Link>
            <Link className="p-3 rounded-md bg-lamaPurpleLight hover:bg-lamaPurple hover:text-white transition-all duration-200 font-semibold text-purple-800" href={`/list/students?teacherId=${teacher.id}`}>
              Alumnos
            </Link>
            <Link className="p-3 rounded-md bg-lamaYellowLight hover:bg-lamaYellow hover:text-white transition-all duration-200 font-semibold text-yellow-800" href={`/list/lessons?teacherId=${teacher.id}`}>
              Cursos
            </Link>
            <Link className="p-3 rounded-md bg-pink-50 hover:bg-pink-100 hover:text-white transition-all duration-200 font-semibold text-pink-800" href={`/list/exams?teacherId=${teacher.id}`}>
              Exámenes
            </Link>
          </div>
        </div>
        <Performance value={averageEvaluation} title="Evaluación Docente" />
        <TeacherPayrollSummary
          teacherId={teacher.id}
          teacherName={teacher.name}
          pendingHours={pendingHours}
          pendingAmount={pendingAmount}
          lastPaymentAmount={lastPaymentAmount}
          lastPaymentDate={lastPaymentDate}
        />
        <Announcements data={announcements} />
      </div>
    </div>
  </div>
);
};

export default SingleTeacherPage;
