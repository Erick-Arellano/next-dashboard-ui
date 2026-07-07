import prisma from "@/lib/prisma";
import EvaluationForm from "@/components/forms/EvaluationForm";

export const dynamic = "force-dynamic";

export default async function StudentEvaluationsPage() {
  // Load all classes with supervisor teachers
  const classes = await prisma.class.findMany({
    include: {
      supervisor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="p-4">
      <EvaluationForm classes={classes} isPublic={false} />
    </div>
  );
}
