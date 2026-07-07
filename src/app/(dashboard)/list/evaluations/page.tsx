import prisma from "@/lib/prisma";
import EvaluationDashboard from "@/components/EvaluationDashboard";

export const dynamic = "force-dynamic";

export default async function EvaluationsListPage() {
  // 1. Fetch Evaluations
  const evaluations = await prisma.evaluation.findMany({
    include: {
      class: { select: { name: true } },
      teacher: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  });

  // 2. Fetch Teachers
  const teachers = await prisma.teacher.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // 3. Fetch Classes with Supervisors
  const classes = await prisma.class.findMany({
    include: {
      supervisor: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 bg-[#F7F8FA] min-h-screen">
      <EvaluationDashboard
        evaluations={evaluations}
        teachers={teachers}
        classes={classes}
      />
    </div>
  );
}
