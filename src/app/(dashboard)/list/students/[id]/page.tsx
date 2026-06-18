export const dynamic = "force-dynamic";

import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalender";
import Performance from "@/components/Performance";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

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

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-1/3">
              <Image
                src={student.photo || "/noAvatar.png"}
                alt=""
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover"
              />
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <h1 className="text-xl font-semibold">{student.name}</h1>
              <p className="text-sm text-gray-500">
                Alumno de idiomas cursando su formación formativa en Vocali.
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
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
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleAttendance.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">90%</h1>
                <span className="text-sm text-gray-400">Asistencia</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleBranch.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{student.grade}º</h1>
                <span className="text-sm text-gray-400">Nivel</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleLesson.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">
                  {student.class?._count.lessons || 0}
                </h1>
                <span className="text-sm text-gray-400">Lecciones</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleClass.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{student.classId || "-"}</h1>
                <span className="text-sm text-gray-400">Grupo</span>
              </div>
            </div>
          </div>
        </div>
        {/* BOTTOM */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
          <h1>Horario del Alumno</h1>
          <BigCalendar />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Accesos Rápidos</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            <Link className="p-3 rounded-md bg-lamaSkyLight" href={`/list/lessons?classId=${student.classId}`}>
              Lecciones del Alumno
            </Link>
            <Link className="p-3 rounded-md bg-lamaPurpleLight" href={`/list/teachers?classId=${student.classId}`}>
              Profesores del Alumno
            </Link>
            <Link className="p-3 rounded-md bg-pink-50" href={`/list/exams?classId=${student.classId}`}>
              Exámenes del Alumno
            </Link>
            <Link className="p-3 rounded-md bg-lamaSkyLight" href={`/list/assignments?classId=${student.classId}`}>
              Tareas del Alumno
            </Link>
            <Link className="p-3 rounded-md bg-lamaYellowLight" href={`/list/results?studentId=${student.id}`}>
              Calificaciones del Alumno
            </Link>
          </div>
        </div>
        <Performance />
        <Announcements />
      </div>
    </div>
  );
};

export default SingleStudentPage;
