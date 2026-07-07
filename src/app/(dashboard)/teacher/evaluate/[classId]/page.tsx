import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import EvaluateClassClient from "@/components/EvaluateClassClient";

export const dynamic = "force-dynamic";

export default async function EvaluateClassPage({
  params,
  searchParams,
}: {
  params: { classId: string };
  searchParams: { simulateId?: string };
}) {
  const { role, teacherId: sessionTeacherId } = await getSession();

  // Determine active teacher (session or simulated by admin)
  let activeTeacherId = sessionTeacherId;
  if (role === "admin" && searchParams.simulateId) {
    activeTeacherId = searchParams.simulateId;
  }

  // If no teacher logged in/simulated, redirect to sign-in
  if (!activeTeacherId) {
    redirect("/sign-in");
  }

  // Query Class data with students and their reportCards for this class
  const classData = await prisma.class.findUnique({
    where: { id: params.classId },
    include: {
      students: {
        include: {
          reportCards: {
            where: { classId: params.classId },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!classData) {
    return notFound();
  }

  // Serialize to plain JSON-compatible objects
  const serializedStudents = classData.students.map((s) => ({
    id: s.id,
    name: s.name,
    reportCards: s.reportCards.map((rc) => ({
      id: rc.id,
      reading: rc.reading,
      grammar: rc.grammar,
      listening: rc.listening,
      speaking: rc.speaking,
      total: rc.total,
      observations: rc.observations,
      dateText: rc.dateText,
    })),
  }));

  return (
    <EvaluateClassClient
      classId={classData.id}
      className={classData.name}
      teacherId={activeTeacherId}
      students={serializedStudents}
    />
  );
}
