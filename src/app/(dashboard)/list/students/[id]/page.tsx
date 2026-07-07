export const dynamic = "force-dynamic";

import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalender";
import Performance from "@/components/Performance";
import FormModal from "@/components/FormModal";
import StudentPaymentStatus from "@/components/StudentPaymentStatus";
import { role } from "@/lib/data";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { mapLessonsToEvents } from "@/lib/calendarHelpers";

const SingleStudentPage = async ({
  params,
}: {
  params: { id: string };
}) => {
  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      class: {
        include: {
          _count: {
            select: {
              lessons: true,
            },
          },
        },
      },
    },
  });

  if (!student) {
    return notFound();
  }

  // 1. Fetch Student Lessons
  const lessons = student.classId
    ? await prisma.lesson.findMany({
      where: { classId: student.classId },
      include: {
        subject: { select: { name: true } },
        class: { select: { name: true } },
        teacher: { select: { name: true } },
      },
    })
    : [];

  const calendarEvents = mapLessonsToEvents(lessons);

  // 2. Fetch Average Result Score
  const averageScoreResult = await prisma.result.aggregate({
    where: { studentId: student.id },
    _avg: { score: true },
  });
  const averageScore = averageScoreResult._avg.score !== null ? averageScoreResult._avg.score : null;

  // 3. Fetch Payments
  const payments = await prisma.payment.findMany({
    where: { studentId: student.id },
  });
  const paidCount = payments.filter((p) => p.status === "Pagado").length;
  const pendingPayments = payments.filter((p) => p.status === "Pendiente" || p.status === "Atrasado");
  const pendingCount = pendingPayments.length;
  const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  // 4. Fetch Announcements
  const announcements = await prisma.announcement.findMany({
    where: {
      OR: [
        { classId: student.classId },
        { classId: null }
      ]
    },
    orderBy: { date: "desc" },
    take: 3,
  });

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      {/* BACK LINK */}
      <div className="flex items-center">
        <Link 
          href="/list/students" 
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-vocaliBlue transition-all duration-200 bg-white px-3 py-1.5 rounded-md border border-gray-150 shadow-sm font-semibold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Volver a la lista de Alumnos
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
                src={student.photo || "/avatar.png"}
                alt=""
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover shadow-md"
              />
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-gray-800">{student.name}</h1>
                {role === "admin" && (
                  <FormModal
                    table="student"
                    type="update"
                    data={{
                      id: student.id,
                      name: student.name,
                      email: student.email || "",
                      phone: student.phone || "",
                      address: student.address || "",
                      img: student.photo || "/avatar.png",
                      classId: student.classId || "",
                      grade: student.grade,
                    }}
                  />
                )}
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Alumno de idiomas cursando su formación formativa en Vocali.
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium text-gray-600">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>{student.email || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{student.phone || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/address.png" alt="" width={14} height={14}
                    style={{ filter: "brightness(0) saturate(100%) invert(48%) sepia(85%) saturate(3020%) hue-rotate(200deg) brightness(96%) contrast(85%)" }} // blue filter
                  />
                  <span className="truncate max-w-[150px]">{student.address || "-"}</span>
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
                <h1 className="text-xl font-semibold text-gray-800">{student.grade}º</h1>
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
                <h1 className="text-xl font-semibold text-gray-800">
                  {student.class?._count.lessons || 0}
                </h1>
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
                <h1 className="text-xl font-semibold text-gray-800">{student.classId || "-"}</h1>
                <span className="text-sm text-gray-400 font-medium">Grupo</span>
              </div>
            </div>
          </div>
        </div>
        {/* BOTTOM */}
        <div className="mt-4 bg-white rounded-md p-4 h-[650px] shadow-sm border border-gray-100 flex flex-col">
          <h1 className="text-lg font-semibold text-gray-800 mb-4 flex-shrink-0">Horario del Alumno</h1>
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
            <Link className="p-3 rounded-md bg-lamaSkyLight hover:bg-lamaSky hover:text-white transition-all duration-200 font-semibold text-sky-800" href={`/list/lessons?classId=${student.classId}`}>
              Cursos
            </Link>
            <Link className="p-3 rounded-md bg-lamaPurpleLight hover:bg-lamaPurple hover:text-white transition-all duration-200 font-semibold text-purple-800" href={`/list/teachers?classId=${student.classId}`}>
              Profesores
            </Link>
            <Link className="p-3 rounded-md bg-pink-50 hover:bg-pink-100 hover:text-white transition-all duration-200 font-semibold text-pink-800" href={`/list/exams?classId=${student.classId}`}>
              Exámenes
            </Link>
            <Link className="p-3 rounded-md bg-lamaYellowLight hover:bg-lamaYellow hover:text-white transition-all duration-200 font-semibold text-yellow-800" href={`/list/results?studentId=${student.id}`}>
              Calificaciones
            </Link>
          </div>
        </div>
        <Performance value={averageScore} />
        <StudentPaymentStatus
          studentId={student.id}
          studentName={student.name}
          paidCount={paidCount}
          pendingCount={pendingCount}
          totalPendingAmount={totalPendingAmount}
        />
        <Announcements data={announcements} />
      </div>
    </div>
  </div>
);
};

export default SingleStudentPage;
